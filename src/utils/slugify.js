// Chuyển chuỗi tiếng Việt có dấu thành slug URL-safe, VD:
// "Beta Cinemas" -> "beta-cinemas", "Cầu Giấy" -> "cau-giay".
import { removeVietnameseTones } from "./removeVietnameseTones.js";

export const slugify = (str = "") => {
  return removeVietnameseTones(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default slugify;
