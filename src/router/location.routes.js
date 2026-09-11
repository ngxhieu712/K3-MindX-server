import { Router } from "express";
import { getLocations } from "../controllers/location.controller.js";

const router = Router();

router.get("/", getLocations); // GET /api/locations

export default router;
