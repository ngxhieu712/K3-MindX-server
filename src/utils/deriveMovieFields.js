// Tự suy ra Movie.showingStatus ("now_showing" | "coming_soon") từ releaseDate,
// để admin panel cũ (chỉ biết field `status`: active/inactive) không cần sửa gì
// mà phía khách hàng vẫn có đủ dữ liệu để tách tab "Đang chiếu" / "Sắp chiếu".
//
// Quy tắc: releaseDate ở tương lai (sau hôm nay) -> "coming_soon", ngược lại
// (hôm nay hoặc quá khứ, hoặc không set) -> "now_showing".
export function computeShowingStatus(releaseDate) {
  if (!releaseDate) return "now_showing";
  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return release.getTime() > today.getTime() ? "coming_soon" : "now_showing";
}

export default computeShowingStatus;
