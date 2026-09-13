// Tự suy ra các field "chuẩn hoá mới" của Showtime (cinemaId, auditoriumId,
// startTime, endTime, price) từ các field "cũ" (cinema: tên rạp dạng String,
// room: tên phòng dạng String, date/time: String, seats: tổng số ghế) —
// để admin panel cũ tạo/sửa suất chiếu bình thường mà không cần biết gì về
// Auditorium/Seat, nhưng phía khách hàng vẫn có dữ liệu phòng chiếu + ghế thật.
//
// QUAN TRỌNG (yêu cầu "1 phim + 1 khung giờ + 1 rạp chỉ chiếu đúng 1 phòng"):
// Auditorium được find-or-create theo cặp khoá (cinemaId, code = room), nên
// dù showtime được tạo bao nhiêu lần / bởi admin hay bởi seed script, hễ cùng
// rạp + cùng tên phòng thì LUÔN trỏ về đúng 1 Auditorium duy nhất (unique index
// đã có sẵn ở model/Auditorium.js) => tất cả khách hàng xem cùng 1 sơ đồ ghế.
//
// TRIẾT LÝ AN TOÀN: hàm này KHÔNG BAO GIỜ throw để làm hỏng luồng save() gốc
// của admin — nếu thiếu dữ liệu để suy ra (VD: tên rạp gõ sai, không khớp
// Cinema nào) thì bỏ qua, showtime đó chỉ đơn giản là chưa đặt vé được ở phía
// khách hàng cho tới khi dữ liệu được sửa đúng, các chức năng admin khác không
// bị ảnh hưởng.
import { Cinema } from "../model/Cinema.js";
import { Auditorium } from "../model/Auditorium.js";
import { Movie } from "../model/Movie.js";
import { generateSeatsForAuditorium } from "./seatGenerator.js";
import {
  DEFAULT_SHOWTIME_PRICE,
  DEFAULT_MOVIE_DURATION_MINUTES,
  SHOWTIME_END_BUFFER_MINUTES,
} from "../config/constants.js";

function inferAuditoriumType(format) {
  if (format === "IMAX") return "imax";
  if (format === "4DX") return "4dx";
  return "standard";
}

function parseStartTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveCinemaId(existingCinemaId, cinemaName) {
  if (existingCinemaId) return existingCinemaId;
  if (!cinemaName) return null;
  const cinema = await Cinema.findOne({ name: cinemaName }).select("_id").lean();
  return cinema ? cinema._id : null;
}

async function resolveAuditoriumId({ existingAuditoriumId, cinemaId, room, seats, format }) {
  if (existingAuditoriumId) return existingAuditoriumId;
  if (!cinemaId) return null;

  const code = (room || "").trim() || "P1";
  let auditorium = await Auditorium.findOne({ cinemaId, code });

  if (!auditorium) {
    auditorium = await Auditorium.create({
      cinemaId,
      code,
      name: room || code,
      type: inferAuditoriumType(format),
      capacity: seats || 80,
    });
    // Phòng vừa tạo -> sinh luôn sơ đồ ghế mặc định cho phòng đó.
    await generateSeatsForAuditorium(auditorium._id, auditorium.capacity);
  }

  return auditorium._id;
}

async function resolveEndTime(startTime, movieId, existingEndTime) {
  if (existingEndTime) return existingEndTime;
  if (!startTime) return null;

  let durationMinutes = DEFAULT_MOVIE_DURATION_MINUTES;
  if (movieId) {
    const movie = await Movie.findById(movieId).select("duration").lean();
    if (movie?.duration) durationMinutes = movie.duration;
  }

  return new Date(
    startTime.getTime() + (durationMinutes + SHOWTIME_END_BUFFER_MINUTES) * 60 * 1000,
  );
}

function resolvePrice(existingPrice) {
  return {
    standard: existingPrice?.standard ?? DEFAULT_SHOWTIME_PRICE.standard,
    vip: existingPrice?.vip ?? DEFAULT_SHOWTIME_PRICE.vip,
    couple: existingPrice?.couple ?? DEFAULT_SHOWTIME_PRICE.couple,
  };
}

// doc: object đọc từ document Showtime (đã merge field cũ + field mới hiện có).
// Trả về object các field CẦN CẬP NHẬT (chỉ tính phần còn thiếu).
export async function deriveShowtimeFields(doc) {
  const result = {};

  try {
    const cinemaId = await resolveCinemaId(doc.cinemaId, doc.cinema);
    if (cinemaId && !doc.cinemaId) result.cinemaId = cinemaId;

    const effectiveCinemaId = doc.cinemaId || cinemaId;
    const auditoriumId = await resolveAuditoriumId({
      existingAuditoriumId: doc.auditoriumId,
      cinemaId: effectiveCinemaId,
      room: doc.room,
      seats: doc.seats,
      format: doc.format,
    });
    if (auditoriumId && !doc.auditoriumId) result.auditoriumId = auditoriumId;

    if (!doc.startTime) {
      const startTime = parseStartTime(doc.date, doc.time);
      if (startTime) result.startTime = startTime;
    }

    const effectiveStartTime = doc.startTime || result.startTime;
    if (!doc.endTime && effectiveStartTime) {
      const endTime = await resolveEndTime(effectiveStartTime, doc.movie, doc.endTime);
      if (endTime) result.endTime = endTime;
    }

    if (!doc.price?.standard || !doc.price?.vip || !doc.price?.couple) {
      result.price = resolvePrice(doc.price);
    }
  } catch (err) {
    // Không throw — chỉ log để dev biết mà kiểm tra dữ liệu, không chặn admin.
    console.warn("[deriveShowtimeFields] Bỏ qua vì lỗi:", err.message);
  }

  return result;
}

export default deriveShowtimeFields;
