import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  getShowDates,
  getShowtimesByCinemaAndDate,
  getSeatLayoutForShowtime,
} from "../services/showtime.service.js";

// GET /api/showtimes/show-dates/:cinemaId
export const listShowDates = asyncHandler(async (req, res) => {
  const { cinemaId } = req.params;
  const dates = await getShowDates(cinemaId);
  return sendSuccess(res, dates);
});

// GET /api/showtimes?cinemaId=&date=
export const listShowtimes = asyncHandler(async (req, res) => {
  const { cinemaId, date } = req.query;

  if (!cinemaId || !date) {
    return sendError(res, "Thiếu cinemaId hoặc date", 400);
  }

  const data = await getShowtimesByCinemaAndDate(cinemaId, date);
  return sendSuccess(res, data);
});

// GET /api/showtimes/:showtimeId/seats
export const getSeatLayout = asyncHandler(async (req, res) => {
  const { showtimeId } = req.params;
  const data = await getSeatLayoutForShowtime(showtimeId);

  if (!data) {
    return sendError(res, "Không tìm thấy suất chiếu", 404);
  }

  return sendSuccess(res, data);
});

export default { listShowDates, listShowtimes, getSeatLayout };
