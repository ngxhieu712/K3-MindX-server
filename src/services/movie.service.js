import { Movie } from "../model/Movie.js";

// GET /api/customer/movies
// Trả về { nowShowing: [...], comingSoon: [...] } để khớp thẳng với 2 tab của FE
// (MOVIE_TAB.NOW / MOVIE_TAB.SOON), không cần FE tự lọc lại theo status.
// Luôn lọc status:"active" trước — đây là công tắc ẨN/HIỆN của admin panel,
// phim "inactive" thì không hiện ở đâu cả phía khách hàng dù showingStatus gì.
export const getMoviesGrouped = async () => {
  const [nowShowing, comingSoon] = await Promise.all([
    Movie.find({ status: "active", showingStatus: "now_showing" })
      .sort({ releaseDate: -1 })
      .lean(),
    Movie.find({ status: "active", showingStatus: "coming_soon" })
      .sort({ releaseDate: 1 })
      .lean(),
  ]);

  return { nowShowing, comingSoon };
};

export default { getMoviesGrouped };
