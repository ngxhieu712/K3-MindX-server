import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { getOrCreateWallet, generateTopupQr, confirmTopup } from "../services/wallet.service.js";

// GET /api/customer/wallet
export const getMyWallet = asyncHandler(async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.sub);
    return sendSuccess(res, wallet);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

// POST /api/customer/wallet/topup/qr  body: { amount }
export const requestTopupQr = asyncHandler(async (req, res) => {
  try {
    const data = await generateTopupQr(req.user.sub, Number(req.body.amount));
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

// POST /api/customer/wallet/topup/confirm  body: { amount }
export const confirmTopupDemo = asyncHandler(async (req, res) => {
  try {
    const wallet = await confirmTopup(req.user.sub, Number(req.body.amount));
    return sendSuccess(res, wallet);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
});

export default { getMyWallet, requestTopupQr, confirmTopupDemo };
