import { Showtime } from "../models/Showtime.js";
import { Seat } from "../models/Seat.js";
import { Booking } from "../models/Booking.js";

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

// GET /api/showtimes/show-dates/:cinemaId
// Trả về danh sách ngày (YYYY-MM-DD) còn suất chiếu khả dụng tại 1 rạp, thay cho
// mảng "dates" tĩnh trong mock cũ.
export const getShowDates = async (cinemaId) => {
  const showtimes = await Showtime.find({
    cinemaId,
    status: "available",
    startTime: { $gte: new Date() },
  })
    .select("startTime")
    .lean();

  const uniqueDates = [
    ...new Set(showtimes.map((s) => s.startTime.toISOString().slice(0, 10))),
  ].sort();

  return uniqueDates;
};

// GET /api/showtimes?cinemaId=&date=
// Trả về đúng shape bạn đề xuất: gom showtimes theo movie.
export const getShowtimesByCinemaAndDate = async (cinemaId, date) => {
  const showtimes = await Showtime.find({
    cinemaId,
    status: "available",
    startTime: { $gte: startOfDay(date), $lte: endOfDay(date) },
  })
    .populate("movieId")
    .populate("auditoriumId", "name code type")
    .sort({ startTime: 1 })
    .lean();

  const grouped = new Map();

  for (const st of showtimes) {
    const movie = st.movieId;
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

// GET /api/showtimes/:showtimeId/seats
// Trả về sơ đồ ghế thật của phòng chiếu, đánh dấu ghế nào đang unavailable
// (đã "paid", hoặc đang "pending" mà chưa hết hạn giữ chỗ).
export const getSeatLayoutForShowtime = async (showtimeId) => {
  const showtime = await Showtime.findById(showtimeId)
    .populate("movieId")
    .populate("cinemaId", "name")
    .populate("auditoriumId", "name code type capacity")
    .lean();

  if (!showtime) return null;

  const seats = await Seat.find({
    auditoriumId: showtime.auditoriumId._id,
    isActive: true,
  })
    .sort({ row: 1, number: 1 })
    .lean();

  const activeBookings = await Booking.find({
    showtimeId,
    $or: [
      { status: "paid" },
      { status: "pending", expiresAt: { $gt: new Date() } },
    ],
  })
    .select("seats.seatId")
    .lean();

  const occupiedSeatIds = new Set(
    activeBookings.flatMap((booking) =>
      booking.seats.map((s) => String(s.seatId)),
    ),
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

  return {
    showtime: {
      _id: showtime._id,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      format: showtime.format,
      price: showtime.price,
    },
    movie: showtime.movieId,
    cinema: showtime.cinemaId,
    auditorium: showtime.auditoriumId,
    rows,
  };
};

export default {
  getShowDates,
  getShowtimesByCinemaAndDate,
  getSeatLayoutForShowtime,
};
