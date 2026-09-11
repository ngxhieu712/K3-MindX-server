import { Router } from "express";
import {
  listShowDates,
  listShowtimes,
  getSeatLayout,
} from "../controllers/showtime.controller.js";

const router = Router();

router.get("/show-dates/:cinemaId", listShowDates); // GET /api/showtimes/show-dates/:cinemaId
router.get("/", listShowtimes); // GET /api/showtimes?cinemaId=&date=
router.get("/:showtimeId/seats", getSeatLayout); // GET /api/showtimes/:showtimeId/seats

export default router;
