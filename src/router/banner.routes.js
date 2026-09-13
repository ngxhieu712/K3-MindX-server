import { Router } from "express";
import { listActiveBanners } from "../controller/banner.controller.js";

const router = Router();

router.get("/", listActiveBanners); // GET /api/customer/banners

export default router;
