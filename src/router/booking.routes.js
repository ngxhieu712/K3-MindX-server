import { Router } from "express";
import { holdSeats, getBookingById, getMyBookings, postRefundRequest } from "../controller/booking.controller.js";
import { authenticateToken } from "../middleware/Auth.js";

const router = Router();

router.use(authenticateToken); // toàn bộ route booking đều cần đăng nhập (yêu cầu #2)

router.get("/", getMyBookings); // GET /api/customer/bookings — lịch sử vé thật
router.post("/", holdSeats); // POST /api/customer/bookings
router.get("/:bookingId", getBookingById); // GET /api/customer/bookings/:bookingId
router.post("/:bookingId/refund-request", postRefundRequest); // yêu cầu hoàn vé (chờ admin duyệt)

export default router;
