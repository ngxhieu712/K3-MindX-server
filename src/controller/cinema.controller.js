import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  getCinemasByDistrict,
  getCinemaById,
  getFeaturedMoviesForCinema,
} from "../services/cinema.service.js";

// GET /api/cinemas?districtId=...
export const listCinemas = asyncHandler(async (req, res) => {
  const { districtId } = req.query;
  const cinemas = await getCinemasByDistrict(districtId);
  return sendSuccess(res, cinemas);
});

// GET /api/cinemas/:cinemaId
export const getCinemaDetails = asyncHandler(async (req, res) => {
  const { cinemaId } = req.params;
  const cinema = await getCinemaById(cinemaId);

  if (!cinema) {
    return sendError(res, "Không tìm thấy rạp chiếu phim", 404);
  }

  const featuredMovies = await getFeaturedMoviesForCinema(cinemaId);

  return sendSuccess(res, { ...cinema, featuredMovies });
});

export default { listCinemas, getCinemaDetails };
