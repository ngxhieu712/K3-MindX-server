import { Router } from "express";
import { getLocations } from "../controller/location.controller.js";

const router = Router();

router.get("/", getLocations); // GET /api/customer/locations

export default router;
