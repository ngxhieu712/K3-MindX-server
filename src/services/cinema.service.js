import { Cinema } from "../model/Cinema.js";
import { Movie } from "../model/Movie.js";

const districtPopulate = {
  path: "districtId",
  select: "name slug parentId",
  populate: { path: "parentId", select: "name slug" },
};

// GET /api/customer/cinemas?districtId=...
export const getCinemasByDistrict = async (districtId) => {
  const filter = { isActive: true };
  if (districtId) filter.districtId = districtId;

  return Cinema.find(filter)
    .populate("brandId", "name slug logoUrl")
    .populate(districtPopulate)
    .sort({ name: 1 })
    .lean();
};

// GET /api/customer/cinemas/:cinemaId
export const getCinemaById = async (cinemaId) => {
  return Cinema.findById(cinemaId)
    .populate("brandId", "name slug logoUrl")
    .populate(districtPopulate)
    .lean();
};

/**
 * ĐIỂM MỞ RỘNG TRONG TƯƠNG LAI:
 * "Phim hot theo rạp" hiện do admin quyết định nhưng CHƯA cần implement logic
 * thật ở bước này. Hàm dưới đây được tách riêng làm placeholder, để sau này
 * chỉ cần sửa NỘI DUNG hàm này (không cần đụng vào controller/route) khi đã
 * chốt được model lưu trữ, ví dụ:
 *   - Thêm field `isHot: Boolean` vào Movie, rồi query Movie.find({ isHot: true })
 *   - Hoặc tạo collection `CinemaFeaturedMovie { cinemaId, movieId, order }`
 * Hiện tại tạm trả về các phim đang chiếu (status active + showingStatus
 * now_showing) mới nhất làm giá trị mặc định.
 */
export const getFeaturedMoviesForCinema = async (_cinemaId, limit = 5) => {
  return Movie.find({ status: "active", showingStatus: "now_showing" })
    .sort({ releaseDate: -1 })
    .limit(limit)
    .lean();
};

export default { getCinemasByDistrict, getCinemaById, getFeaturedMoviesForCinema };
