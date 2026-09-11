import { Router } from "express";
import { createQrPayment } from "../controllers/payment.controller.js";
// TODO: SỬA LẠI đường dẫn import cho khớp vị trí thật (xem ghi chú ở booking.routes.js)
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/bookings/:bookingId/qr", createQrPayment); // POST /api/payments/bookings/:bookingId/qr

export default router;
