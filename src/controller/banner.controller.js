import { Banner } from "../model/Banner.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

// GET /api/customer/banners — CHỈ trả banner đang active, KHÔNG cần đăng nhập.
// Tách riêng khỏi controller/Banner.js (admin, có CRUD đầy đủ + requireAdmin)
// để không đụng gì vào quyền quản trị hiện có.
export const listActiveBanners = asyncHandler(async (req, res) => {
  const data = await Banner.find({ active: true }).sort({ order: 1 });
  return sendSuccess(res, data);
});

export default { listActiveBanners };
