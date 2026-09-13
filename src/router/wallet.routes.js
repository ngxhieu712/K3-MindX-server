import { Router } from "express";
import { getMyWallet, requestTopupQr, confirmTopupDemo } from "../controller/wallet.controller.js";
import { authenticateToken } from "../middleware/Auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getMyWallet); // GET /api/customer/wallet
router.post("/topup/qr", requestTopupQr); // POST /api/customer/wallet/topup/qr
router.post("/topup/confirm", confirmTopupDemo); // POST /api/customer/wallet/topup/confirm

export default router;
