import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listRefunds, approveRefund, rejectRefund } from "../controller/Refund.js";

const router = Router();

router.get("/", requireAdmin, listRefunds);
router.patch("/:id/approve", requireAdmin, approveRefund);
router.patch("/:id/reject", requireAdmin, rejectRefund);

export default router;
