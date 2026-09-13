import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { generateQrPayment, confirmBankPaymentDemo } from "../services/payment.service.js";
import { payBookingWithWallet } from "../services/wallet.service.js";

// POST /api/customer/payments/bookings/:bookingId/qr  (yêu cầu đăng nhập)
export const createQrPayment = asyncHandler(async (req, res) => {
  try {
    const data = await generateQrPayment(req.params.bookingId, req.user.sub);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

// POST /api/customer/payments/bookings/:bookingId/confirm-demo
export const confirmDemo = asyncHandler(async (req, res) => {
  try {
    const booking = await confirmBankPaymentDemo(req.params.bookingId, req.user.sub);
    return sendSuccess(res, booking);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

// POST /api/customer/payments/bookings/:bookingId/pay-wallet
export const payWithWallet = asyncHandler(async (req, res) => {
  try {
    const data = await payBookingWithWallet(req.user.sub, req.params.bookingId);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

export default { createQrPayment, confirmDemo, payWithWallet };
