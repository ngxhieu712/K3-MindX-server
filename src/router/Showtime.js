import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listShowtimes, createShowtime, updateShowtime, deleteShowtime } from "../controller/Showtime.js";

const router = Router();

router.get("/", requireAdmin, listShowtimes);
router.post("/", requireAdmin, createShowtime);
router.put("/:id", requireAdmin, updateShowtime);
router.delete("/:id", requireAdmin, deleteShowtime);

export default router;
