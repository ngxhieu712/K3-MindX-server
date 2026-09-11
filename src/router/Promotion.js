import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listVouchers, createVoucher, updateVoucher, deleteVoucher } from "../controller/Promotion.js";

const router = Router();

router.get("/", requireAdmin, listVouchers);
router.post("/", requireAdmin, createVoucher);
router.put("/:id", requireAdmin, updateVoucher);
router.delete("/:id", requireAdmin, deleteVoucher);

export default router;
