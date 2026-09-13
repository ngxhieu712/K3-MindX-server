import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { createHold, getBookingSummary, listMyBookings, requestRefund } from "../services/booking.service.js";

// POST /api/bookings  (yêu cầu đăng nhập)
// body: { showtimeId, seatIds: [seatId, ...] }
export const holdSeats = asyncHandler(async (req, res) => {
  try {
    // GIẢ ĐỊNH: middleware authenticateToken set req.user = { sub, username, role }
    // và req.user.sub CHÍNH LÀ ObjectId (dạng string) của User trong MongoDB.
    const booking = await createHold({
      userId: req.user.sub,
      showtimeId: req.body.showtimeId,
      seatIds: req.body.seatIds,
    });
    return sendSuccess(res, booking, 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

// GET /api/bookings/:bookingId  (yêu cầu đăng nhập)
export const getBookingById = asyncHandler(async (req, res) => {
  const summary = await getBookingSummary(req.params.bookingId, req.user.sub);

  if (!summary) {
    return sendError(res, "Không tìm thấy đơn đặt vé", 404);
  }

  return sendSuccess(res, summary);
});

// GET /api/customer/bookings — Lịch sử vé thật của user đang đăng nhập
export const getMyBookings = asyncHandler(async (req, res) => {
  const data = await listMyBookings(req.user.sub);
  return sendSuccess(res, data);
});

// POST /api/customer/bookings/:bookingId/refund-request
export const postRefundRequest = asyncHandler(async (req, res) => {
  try {
    const refund = await requestRefund({ bookingId: req.params.bookingId, userId: req.user.sub });
    return sendSuccess(res, refund, 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

export default { holdSeats, getBookingById, getMyBookings, postRefundRequest };
