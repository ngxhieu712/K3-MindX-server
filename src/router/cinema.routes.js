import { Router } from "express";
import {
  listCinemas,
  getCinemaDetails,
} from "../controllers/cinema.controller.js";

const router = Router();

router.get("/", listCinemas); // GET /api/cinemas?districtId=...
router.get("/:cinemaId", getCinemaDetails); // GET /api/cinemas/:cinemaId

export default router;
