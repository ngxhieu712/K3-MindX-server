import { Router } from "express";
import { createQrPayment, confirmDemo, payWithWallet } from "../controller/payment.controller.js";
import { authenticateToken } from "../middleware/Auth.js";

const router = Router();

router.use(authenticateToken);

router.post("/bookings/:bookingId/qr", createQrPayment); // POST /api/customer/payments/bookings/:bookingId/qr
router.post("/bookings/:bookingId/confirm-demo", confirmDemo); // demo: đã chuyển khoản ngân hàng
router.post("/bookings/:bookingId/pay-wallet", payWithWallet); // thanh toán bằng ví thật

export default router;
