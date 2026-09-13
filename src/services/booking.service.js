import mongoose from "mongoose";
import { Showtime } from "../model/Showtime.js";
import { Seat } from "../model/Seat.js";
import { Booking } from "../model/Booking.js";
import { User } from "../model/User.js";
import { Refund } from "../model/Refund.js";
import { Ticket } from "../model/Ticket.js";
import {
  BOOKING_HOLD_DURATION_MINUTES,
  BOOKABLE_SHOWTIME_STATUSES,
  REFUND_FEE_PERCENT,
} from "../config/constants.js";
import { genCode } from "../utils/genCode.js";

const priceForSeatType = (seatType, price) => {
  if (seatType === "vip") return price.vip ?? price.standard;
  if (seatType === "couple") return price.couple ?? price.standard;
  return price.standard;
};

const makeError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// POST /api/customer/bookings — tạo booking "pending" = giữ ghế tạm thời.
//
// CHỐNG RACE CONDITION (2 người bấm giữ cùng ghế cùng lúc): toàn bộ đoạn
// "kiểm tra ghế còn trống" + "tạo booking" được bọc trong 1 MongoDB
// transaction — người thứ 2 commit sau sẽ thấy write conflict và bị chặn ở
// vòng retry cuối, không thể lọt qua bước kiểm tra như cách check-rồi-tạo
// (optimistic) thông thường.
//
// YÊU CẦU HẠ TẦNG: transaction chỉ chạy được khi MongoDB là replica set
// (MongoDB Atlas mặc định đã là replica set — không cần chỉnh gì thêm; nếu
// bạn chạy `mongod` local đơn lẻ (standalone) thì gọi hàm này sẽ báo lỗi kiểu
// "Transaction numbers are only allowed on a replica set member or mongos".
// Cách bật nhanh cho local: chạy mongod với `--replSet rs0` rồi
// `rs.initiate()` một lần trong mongosh).
export const createHold = async ({ userId, showtimeId, seatIds }) => {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw makeError("Cần chọn ít nhất 1 ghế", 400);
  }

  const session = await mongoose.startSession();
  try {
    let booking;

    await session.withTransaction(async () => {
      const showtime = await Showtime.findById(showtimeId).session(session).lean();
      if (!showtime || !BOOKABLE_SHOWTIME_STATUSES.includes(showtime.status)) {
        throw makeError("Suất chiếu không hợp lệ hoặc đã đóng", 400);
      }
      if (!showtime.auditoriumId) {
        throw makeError("Suất chiếu này chưa gắn phòng chiếu, vui lòng liên hệ quản trị viên", 400);
      }

      const seats = await Seat.find({ _id: { $in: seatIds }, isActive: true })
        .session(session)
        .lean();
      if (seats.length !== seatIds.length) {
        throw makeError("Một số ghế không tồn tại hoặc đã bị vô hiệu hóa", 400);
      }
      const seatOutsideAuditorium = seats.some(
        (s) => String(s.auditoriumId) !== String(showtime.auditoriumId),
      );
      if (seatOutsideAuditorium) {
        throw makeError("Ghế không thuộc phòng chiếu của suất chiếu này", 400);
      }

      // Đọc + ghi trong CÙNG transaction: nếu 2 request chạy song song cùng
      // giữ 1 ghế, MongoDB sẽ phát hiện write conflict và tự động khiến 1
      // trong 2 transaction thất bại (withTransaction tự retry, lần sau đọc
      // lại sẽ thấy ghế đã bị đối thủ giữ trước và dừng ở đây).
      const conflicting = await Booking.find({
        showtime: showtimeId,
        "seatDetails.seatId": { $in: seatIds },
        $or: [{ status: "confirmed" }, { status: "pending", expiresAt: { $gt: new Date() } }],
      })
        .session(session)
        .lean();

      if (conflicting.length > 0) {
        throw makeError("Một hoặc nhiều ghế vừa được người khác giữ/đặt, vui lòng chọn lại", 409);
      }

      const user = await User.findById(userId).select("fullName").session(session).lean();
      if (!user) throw makeError("Không tìm thấy người dùng", 404);

      const seatDetails = seats.map((seat) => ({
        seatId: seat._id,
        seatName: `${seat.row}${seat.number}`,
        seatType: seat.type,
        price: priceForSeatType(seat.type, showtime.price || {}),
      }));

      const totalAmount = seatDetails.reduce((sum, s) => sum + s.price, 0);
      const expiresAt = new Date(Date.now() + BOOKING_HOLD_DURATION_MINUTES * 60 * 1000);
      const code = await genCode(Booking, "BK");

      const created = await Booking.create(
        [
          {
            code,
            user: userId,
            userName: user.fullName,
            showtime: showtimeId,
            movie: showtime.movieTitle,
            cinema: showtime.cinema,
            date: showtime.date,
            time: showtime.time,
            seats: seatDetails.map((s) => s.seatName), // field cũ [String], giữ đồng bộ cho admin
            total: Math.round(totalAmount / 1000),
            status: "pending",
            seatDetails,
            totalAmount,
            expiresAt,
            movieId: showtime.movie,
            cinemaId: showtime.cinemaId,
            auditoriumId: showtime.auditoriumId,
          },
        ],
        { session }, // Model.create() với session BẮT BUỘC truyền docs dạng mảng
      );
      booking = created[0];
    });

    return booking.toObject();
  } finally {
    await session.endSession();
  }
};

// Tạo Ticket THẬT cho từng ghế sau khi booking chuyển "confirmed" (thanh toán
// thành công, dù bằng ví hay QR ngân hàng) — dùng chung cho cả 2 luồng thanh
// toán (payment.service.js#confirmBankPaymentDemo, wallet.service.js#payBookingWithWallet).
// Idempotent: nếu gọi lại cho cùng 1 booking (vd double-click nút demo), bỏ
// qua êm nếu vé đã được tạo trước đó thay vì tạo trùng/ném lỗi.
export const createTicketsForBooking = async (booking) => {
  // Mã vé xác định theo (booking.code, tên ghế) — KHÔNG đếm số document hiện
  // có, nên không có khái niệm "đọc trùng số đếm rồi trùng mã" nữa, dù gọi
  // song song hay gọi lại nhiều lần cho cùng 1 booking (vd double-click nút
  // demo, hoặc lần trước lỗi giữa chừng để sót vài ghế chưa có vé).
  //
  // Dùng upsert theo từng ghế (thay vì insertMany + kiểm tra "đã có vé chưa"
  // ở đầu hàm) để tự phục hồi đúng những ghế còn thiếu nếu lần chạy trước bị
  // lỗi giữa chừng, mà không tạo trùng những ghế đã có vé rồi.
  await Promise.all(
    booking.seatDetails.map((seat) =>
      Ticket.updateOne(
        { bookingId: booking._id, seatId: seat.seatId },
        {
          $setOnInsert: {
            bookingId: booking._id,
            userId: booking.user,
            showtimeId: booking.showtime,
            seatId: seat.seatId,
            seatName: seat.seatName,
            ticketCode: `TK-${booking.code}-${seat.seatName}`,
            status: "valid",
          },
        },
        { upsert: true },
      ),
    ),
  );
};

// GET /api/customer/bookings/:bookingId — tóm tắt để hiển thị màn checkout.
export const getBookingSummary = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate("movieId")
    .populate("showtime")
    .populate("cinemaId", "name address")
    .populate("auditoriumId", "name code type")
    .lean();

  if (!booking) return null;

  // Hết hạn giữ chỗ mà vẫn "pending" -> lazy update sang "expired".
  if (
    booking.status === "pending" &&
    booking.expiresAt &&
    booking.expiresAt.getTime() < Date.now()
  ) {
    await Booking.updateOne({ _id: bookingId }, { status: "expired" });
    booking.status = "expired";
  }

  const customer = await User.findById(userId).select("fullName phoneNumber email").lean();

  return {
    booking: {
      _id: booking._id,
      code: booking.code,
      status: booking.status,
      seats: booking.seatDetails,
      totalAmount: booking.totalAmount,
      expiresAt: booking.expiresAt,
      paymentMethod: booking.paymentMethod,
    },
    customer,
    movie: booking.movieId,
    showtime: booking.showtime,
    cinema: booking.cinemaId,
    auditorium: booking.auditoriumId,
  };
};

// GET /api/customer/bookings — "Lịch sử vé" của CHÍNH user đang đăng nhập
// (trước đây phía client đọc từ localStorage dùng chung cho mọi tài khoản —
// đây là bản thay thế thật, mỗi user chỉ thấy booking của chính mình).
// Chỉ trả các booking đã từng thanh toán thật (bỏ "pending"/"expired" — đó là
// giỏ hàng bị bỏ dở, chưa từng là vé thật).
export const listMyBookings = async (userId) => {
  const bookings = await Booking.find({
    user: userId,
    status: { $in: ["confirmed", "completed", "cancelled"] },
  })
    .populate("movieId", "poster title")
    .populate("showtime", "format")
    .populate("auditoriumId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const refunds = await Refund.find({ booking: { $in: bookings.map((b) => b._id) } }).lean();
  const refundByBooking = new Map(refunds.map((r) => [String(r.booking), r]));

  return bookings.map((b) => {
    const refund = refundByBooking.get(String(b._id));
    let clientStatus = b.status === "completed" ? "used" : "active"; // confirmed -> active
    if (refund?.status === "completed") clientStatus = "refunded";
    else if (refund?.status === "pending") clientStatus = "refund_pending";

    return {
      id: b._id,
      bookingId: b.code,
      movie: b.movie,
      poster: b.movieId?.poster || "",
      cinema: b.cinema,
      room: b.auditoriumId?.name || "",
      format: b.showtime?.format || "",
      date: b.date,
      time: b.time,
      seats: b.seats,
      total: b.totalAmount,
      payMethod: b.paymentMethod,
      status: clientStatus,
      purchasedAt: b.createdAt,
      refundedAt: refund?.processedAt || null,
      refundAmount: refund?.refundAmount || null,
      qrData: b.code,
    };
  });
};

// POST /api/customer/bookings/:bookingId/refund-request — tạo YÊU CẦU hoàn vé
// thật (status "pending"), dùng lại đúng model/Refund.js đã có sẵn cho admin
// (controller/Refund.js) duyệt/từ chối — KHÔNG cộng tiền ví ngay ở bước này,
// tiền chỉ về ví sau khi admin bấm duyệt (approveRefund đã tự cộng ví sẵn).
export const requestRefund = async ({ bookingId, userId }) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw makeError("Không tìm thấy đơn đặt vé", 404);
  if (booking.status !== "confirmed") {
    throw makeError("Chỉ có thể yêu cầu hoàn vé đã thanh toán thành công", 400);
  }

  const existing = await Refund.findOne({ booking: booking._id, status: { $ne: "rejected" } });
  if (existing) throw makeError("Vé này đã có yêu cầu hoàn vé", 409);

  const user = await User.findById(userId).select("fullName email");
  const fee = Math.round((booking.totalAmount * REFUND_FEE_PERCENT) / 100);
  const refundAmount = booking.totalAmount - fee;

  const refund = await Refund.create({
    code: await genCode(Refund, "RF"),
    booking: booking._id,
    ticketId: booking.code,
    movie: booking.movie,
    cinema: booking.cinema,
    date: booking.date,
    time: booking.time,
    seats: booking.seats,
    user: userId,
    userName: user?.fullName || booking.userName,
    userEmail: user?.email || "",
    originalAmount: booking.totalAmount,
    refundAmount,
    fee,
    feePercent: REFUND_FEE_PERCENT,
    requestedAt: new Date().toLocaleString("vi-VN"),
    status: "pending",
  });

  return refund.toObject();
};

export default { createHold, getBookingSummary, listMyBookings, requestRefund, createTicketsForBooking };
