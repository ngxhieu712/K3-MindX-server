import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listWallets, getWalletByUser, adjustWallet } from "../controller/Wallet.js";

const router = Router();

router.get("/", requireAdmin, listWallets);
router.get("/:userId", requireAdmin, getWalletByUser);
router.patch("/:userId/adjust", requireAdmin, adjustWallet);

export default router;
