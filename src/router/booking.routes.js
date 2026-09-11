import { Router } from "express";
import { holdSeats, getBookingById } from "../controllers/booking.controller.js";
// TODO: SỬA LẠI đường dẫn import này cho khớp với vị trí thật của middleware
// authenticateToken trong dự án của bạn (file middleware bạn gửi chưa cho biết
// path chính xác, ví dụ có thể là "../middleware/auth.middleware.js").
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken); // toàn bộ route booking đều cần đăng nhập

router.post("/", holdSeats); // POST /api/bookings
router.get("/:bookingId", getBookingById); // GET /api/bookings/:bookingId

export default router;
