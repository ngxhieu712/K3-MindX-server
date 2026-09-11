import { Movie } from "../models/Movie.js";

// GET /api/movies
// Trả về { nowShowing: [...], comingSoon: [...] } để khớp thẳng với 2 tab của FE
// (MOVIE_TAB.NOW / MOVIE_TAB.SOON), không cần FE tự lọc lại theo status.
export const getMoviesGrouped = async () => {
  const [nowShowing, comingSoon] = await Promise.all([
    Movie.find({ status: "now_showing" }).sort({ releaseDate: -1 }).lean(),
    Movie.find({ status: "coming_soon" }).sort({ releaseDate: 1 }).lean(),
  ]);

  return { nowShowing, comingSoon };
};

export default { getMoviesGrouped };
