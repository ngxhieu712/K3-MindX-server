import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import {
  listBanners, createBanner, updateBanner,
  toggleBannerActive, reorderBanner, deleteBanner,
} from "../controller/Banner.js";

const router = Router();

router.get("/", requireAdmin, listBanners);
router.post("/", requireAdmin, createBanner);
router.put("/:id", requireAdmin, updateBanner);
router.patch("/:id/toggle-active", requireAdmin, toggleBannerActive);
router.patch("/:id/reorder", requireAdmin, reorderBanner);
router.delete("/:id", requireAdmin, deleteBanner);

export default router;
