import { Showtime } from "../model/Showtime.js";
import { Seat } from "../model/Seat.js";
import { Booking } from "../model/Booking.js";
import { BOOKABLE_SHOWTIME_STATUSES } from "../config/constants.js";

const startOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
};

// GET /api/customer/showtimes/show-dates/:cinemaId
// Trả về danh sách ngày (YYYY-MM-DD) còn suất chiếu khả dụng tại 1 rạp, thay cho
// mảng "dates" tĩnh trong mock cũ.
export const getShowDates = async (cinemaId) => {
  const showtimes = await Showtime.find({
    cinemaId,
    status: { $in: BOOKABLE_SHOWTIME_STATUSES },
    startTime: { $gte: new Date() },
  })
    .select("startTime")
    .lean();

  const uniqueDates = [
    ...new Set(showtimes.filter((s) => s.startTime).map((s) => s.startTime.toISOString().slice(0, 10))),
  ].sort();

  return uniqueDates;
};

// GET /api/customer/showtimes?cinemaId=&date=
// Trả về đúng shape đề xuất: gom showtimes theo movie.
export const getShowtimesByCinemaAndDate = async (cinemaId, date) => {
  const showtimes = await Showtime.find({
    cinemaId,
    status: { $in: BOOKABLE_SHOWTIME_STATUSES },
    startTime: { $gte: startOfDay(date), $lte: endOfDay(date) },
  })
    .populate("movie")
    .populate("auditoriumId", "name code type")
    .sort({ startTime: 1 })
    .lean();

  const grouped = new Map();

  for (const st of showtimes) {
    const movie = st.movie;
    if (!movie) continue; // dữ liệu thiếu movie hợp lệ -> bỏ qua, không crash cả danh sách
    const key = String(movie._id);

    if (!grouped.has(key)) {
      grouped.set(key, { movie, showtimes: [] });
    }

    grouped.get(key).showtimes.push({
      _id: st._id,
      startTime: st.startTime,
      endTime: st.endTime,
      auditorium: st.auditoriumId,
      format: st.format,
      price: st.price,
    });
  }

  return Array.from(grouped.values());
};

// GET /api/customer/showtimes/:showtimeId/seats
// Trả về sơ đồ ghế THẬT của đúng phòng chiếu gắn với suất chiếu này, đánh dấu
// ghế nào đang unavailable (đã "confirmed", hoặc đang "pending" mà chưa hết
// hạn giữ chỗ) — đây là phần thay thế logic mock cũ (luôn chọn sẵn H7/H8/H9,
// luôn khoá sẵn C3) bằng dữ liệu thật theo từng suất chiếu cụ thể.
export const getSeatLayoutForShowtime = async (showtimeId) => {
  const showtime = await Showtime.findById(showtimeId)
    .populate("movie")
    .populate("cinemaId", "name")
    .populate("auditoriumId", "name code type capacity")
    .lean();

  if (!showtime) return null;
  if (!showtime.auditoriumId) {
    const err = new Error("Suất chiếu này chưa gắn phòng chiếu, vui lòng liên hệ quản trị viên");
    err.statusCode = 400;
    throw err;
  }

  const seats = await Seat.find({
    auditoriumId: showtime.auditoriumId._id,
    isActive: true,
  })
    .sort({ row: 1, number: 1 })
    .lean();

  const activeBookings = await Booking.find({
    showtime: showtimeId,
    $or: [{ status: "confirmed" }, { status: "pending", expiresAt: { $gt: new Date() } }],
  })
    .select("seatDetails.seatId")
    .lean();

  const occupiedSeatIds = new Set(
    activeBookings.flatMap((booking) => booking.seatDetails.map((s) => String(s.seatId))),
  );

  const seatsWithStatus = seats.map((seat) => ({
    _id: seat._id,
    row: seat.row,
    number: seat.number,
    type: seat.type,
    status: occupiedSeatIds.has(String(seat._id)) ? "unavailable" : "available",
  }));

  const rowsMap = new Map();
  for (const seat of seatsWithStatus) {
    if (!rowsMap.has(seat.row)) rowsMap.set(seat.row, []);
    rowsMap.get(seat.row).push(seat);
  }

  const rows = [...rowsMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, seatsInRow]) => ({
      row,
      seats: seatsInRow.sort((a, b) => a.number - b.number),
    }));

  const availableCount = seatsWithStatus.filter((s) => s.status === "available").length;

  return {
    showtime: {
      _id: showtime._id,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      format: showtime.format,
      price: showtime.price,
    },
    movie: showtime.movie,
    cinema: showtime.cinemaId,
    auditorium: showtime.auditoriumId,
    rows,
    totalSeats: seatsWithStatus.length,
    availableSeats: availableCount, // dùng để cập nhật "số ghế còn trống" (yêu cầu #3)
  };
};

export default {
  getShowDates,
  getShowtimesByCinemaAndDate,
  getSeatLayoutForShowtime,
};
