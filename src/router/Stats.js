import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { getOverview, getRevenueByChain, getTopMovies } from "../controller/Stats.js";

const router = Router();

router.get("/overview", requireAdmin, getOverview);
router.get("/revenue-by-chain", requireAdmin, getRevenueByChain);
router.get("/top-movies", requireAdmin, getTopMovies);

export default router;
