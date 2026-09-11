import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listUsers, toggleUserStatus } from "../controller/User.js";

const router = Router();

router.get("/", requireAdmin, listUsers);
router.patch("/:id/toggle-status", requireAdmin, toggleUserStatus);

export default router;
