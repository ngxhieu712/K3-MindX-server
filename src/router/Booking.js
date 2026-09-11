import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listBookings, getBooking, cancelBooking } from "../controller/Booking.js";

const router = Router();

router.get("/", requireAdmin, listBookings);
router.get("/:id", requireAdmin, getBooking);
router.patch("/:id/cancel", requireAdmin, cancelBooking);

export default router;
