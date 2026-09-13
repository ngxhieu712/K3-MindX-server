import { Router } from "express";
import { listCinemas, getCinemaDetails } from "../controller/cinema.controller.js";

const router = Router();

router.get("/", listCinemas); // GET /api/customer/cinemas?districtId=...
router.get("/:cinemaId", getCinemaDetails); // GET /api/customer/cinemas/:cinemaId

export default router;
