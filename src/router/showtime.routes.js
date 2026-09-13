import { Router } from "express";
import { listShowDates, listShowtimes, getSeatLayout } from "../controller/showtime.controller.js";

const router = Router();

router.get("/show-dates/:cinemaId", listShowDates); // GET /api/customer/showtimes/show-dates/:cinemaId
router.get("/", listShowtimes); // GET /api/customer/showtimes?cinemaId=&date=
router.get("/:showtimeId/seats", getSeatLayout); // GET /api/customer/showtimes/:showtimeId/seats

export default router;
