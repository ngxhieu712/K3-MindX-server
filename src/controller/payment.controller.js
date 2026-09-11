import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { generateQrPayment } from "../services/payment.service.js";

// POST /api/payments/bookings/:bookingId/qr  (yêu cầu đăng nhập)
export const createQrPayment = asyncHandler(async (req, res) => {
  try {
    const data = await generateQrPayment(req.params.bookingId, req.user.sub);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

export default { createQrPayment };
