import { Showtime } from "../models/Showtime.js";
import { Seat } from "../models/Seat.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { BOOKING_HOLD_DURATION_MINUTES } from "../config/constants.js";

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

// POST /api/bookings — tạo booking "pending" = giữ ghế tạm thời.
// LƯU Ý (race condition): bước kiểm tra ghế trống rồi tạo booking chưa được bọc
// trong 1 MongoDB transaction. Với lượng truy cập thấp/vừa thì rủi ro 2 người
// giữ trùng ghế trong vài mili-giây là rất thấp, nhưng nếu traffic cao bạn nên
// bọc đoạn find-conflict + create trong `mongoose.startSession()` + transaction,
// hoặc thêm unique index dạng { showtimeId, "seats.seatId" } kết hợp partial filter.
export const createHold = async ({ userId, showtimeId, seatIds }) => {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw makeError("Cần chọn ít nhất 1 ghế", 400);
  }

  const showtime = await Showtime.findById(showtimeId).lean();
  if (!showtime || showtime.status !== "available") {
    throw makeError("Suất chiếu không hợp lệ hoặc đã đóng", 400);
  }

  const seats = await Seat.find({ _id: { $in: seatIds }, isActive: true }).lean();
  if (seats.length !== seatIds.length) {
    throw makeError("Một số ghế không tồn tại hoặc đã bị vô hiệu hóa", 400);
  }

  const conflicting = await Booking.find({
    showtimeId,
    "seats.seatId": { $in: seatIds },
    $or: [
      { status: "paid" },
      { status: "pending", expiresAt: { $gt: new Date() } },
    ],
  }).lean();

  if (conflicting.length > 0) {
    throw makeError(
      "Một hoặc nhiều ghế vừa được người khác giữ/đặt, vui lòng chọn lại",
      409,
    );
  }

  const bookingSeats = seats.map((seat) => ({
    seatId: seat._id,
    seatName: `${seat.row}${seat.number}`,
    seatType: seat.type,
    price: priceForSeatType(seat.type, showtime.price),
  }));

  const totalAmount = bookingSeats.reduce((sum, s) => sum + s.price, 0);
  const expiresAt = new Date(
    Date.now() + BOOKING_HOLD_DURATION_MINUTES * 60 * 1000,
  );

  const booking = await Booking.create({
    userId,
    showtimeId,
    movieId: showtime.movieId,
    cinemaId: showtime.cinemaId,
    auditoriumId: showtime.auditoriumId,
    seats: bookingSeats,
    totalAmount,
    status: "pending",
    expiresAt,
  });

  return booking.toObject();
};

// GET /api/bookings/:bookingId — tóm tắt để hiển thị màn checkout.
export const getBookingSummary = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId })
    .populate("movieId")
    .populate("showtimeId")
    .populate("cinemaId", "name")
    .populate("auditoriumId", "name")
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

  // GIẢ ĐỊNH: model User có các field `name`, `phone`, `email`.
  // Nếu tên field trong project bạn khác, đổi lại chuỗi select() bên dưới.
  const customer = await User.findById(userId)
    .select("name phone email")
    .lean();

  return {
    booking: {
      _id: booking._id,
      status: booking.status,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      expiresAt: booking.expiresAt,
    },
    customer,
    movie: booking.movieId,
    showtime: booking.showtimeId,
    cinema: booking.cinemaId,
    auditorium: booking.auditoriumId,
    // TODO: chưa có collection Combo riêng trong DB (đã xác nhận) -> tạm hardcode.
    // Khi có Combo model, thay đoạn dưới bằng query thật (vd combo do user chọn ở
    // bước trước, lưu comboId trong Booking).
    combo: {
      name: "Combo See Mê - Kim Cương",
      description:
        "TIẾT KIỆM 56K!!! Sở hữu ngay: 1 Ly Kim Cương kèm nước + 1 Bắp (69oz)",
    },
  };
};

export default { createHold, getBookingSummary };
