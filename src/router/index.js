import { Router } from "express";
import locationRoutes from "./location.routes.js";
import cinemaRoutes from "./cinema.routes.js";
import movieRoutes from "./movie.routes.js";
import showtimeRoutes from "./showtime.routes.js";
import bookingRoutes from "./booking.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = Router();

router.use("/locations", locationRoutes);
router.use("/cinemas", cinemaRoutes);
router.use("/movies", movieRoutes);
router.use("/showtimes", showtimeRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);

export default router;

/**
 * Trong app.js / server.js hiện có của bạn, chỉ cần thêm:
 *
 *   import apiRouter from "./routes/index.js";
 *   app.use("/api", apiRouter);
 *
 * (đặt sau app.use(cookieParser()) và sau route auth hiện có của bạn)
 */
