// Gom toàn bộ router "khách hàng" (luồng đặt vé thật) vào 1 chỗ, mount dưới
// prefix /api/customer trong index.js — CỐ TÌNH tách riêng khỏi các path admin
// cũ (/api/movies, /api/cinemas, /api/showtimes, /api/bookings, /api/wallets...)
// để không đụng/đè lên bất kỳ route admin nào đang chạy, dù 2 bên cùng thao
// tác trên các collection Movie/Cinema/Showtime/Booking (xem model — đã thêm
// field mới song song, không đổi field cũ).
//
// Nếu sau này muốn đổi prefix (vd bỏ hẳn "/customer"), chỉ cần sửa 1 dòng
// app.use(...) trong index.js, không cần sửa gì trong các router con.
import { Router } from "express";

import movieRoutes from "./movie.routes.js";
import cinemaRoutes from "./cinema.routes.js";
import locationRoutes from "./location.routes.js";
import showtimeRoutes from "./showtime.routes.js";
import bookingRoutes from "./booking.routes.js";
import paymentRoutes from "./payment.routes.js";
import bannerRoutes from "./banner.routes.js";
import walletRoutes from "./wallet.routes.js";

const router = Router();

router.use("/movies", movieRoutes); // GET /api/customer/movies
router.use("/cinemas", cinemaRoutes); // GET /api/customer/cinemas...
router.use("/locations", locationRoutes); // GET /api/customer/locations
router.use("/showtimes", showtimeRoutes); // GET /api/customer/showtimes...
router.use("/bookings", bookingRoutes); // POST/GET /api/customer/bookings... (cần đăng nhập)
router.use("/payments", paymentRoutes); // POST /api/customer/payments... (cần đăng nhập)
router.use("/banners", bannerRoutes); // GET /api/customer/banners (public, chỉ banner active)
router.use("/wallet", walletRoutes); // GET/POST /api/customer/wallet... (cần đăng nhập)

export default router;
