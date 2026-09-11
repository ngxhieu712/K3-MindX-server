import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listCinemas, createCinema, updateCinema, deleteCinema } from "../controller/Venue.js";

const router = Router();

router.get("/", requireAdmin, listCinemas);
router.post("/", requireAdmin, createCinema);
router.put("/:id", requireAdmin, updateCinema);
router.delete("/:id", requireAdmin, deleteCinema);

export default router;
