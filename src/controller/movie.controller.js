import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getMoviesGrouped } from "../services/movie.service.js";

// GET /api/movies
export const listMovies = asyncHandler(async (req, res) => {
  const data = await getMoviesGrouped();
  return sendSuccess(res, data);
});

export default { listMovies };
