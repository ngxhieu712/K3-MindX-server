import mongoose from "mongoose";
import { Wallet } from "../model/Wallet.js";
import { User } from "../model/User.js";
import { Booking } from "../model/Booking.js";
import { createTicketsForBooking } from "./booking.service.js";
import { BANK_CONFIG, VIETQR_TEMPLATE } from "../config/constants.js";
import { removeVietnameseTones } from "../utils/removeVietnameseTones.js";

const makeError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// Hầu hết user (kể cả các user tạo trước khi có bước tự-tạo-ví ở register())
// sẽ có sẵn Wallet, nhưng vẫn tự tạo (0đ) nếu vì lý do gì đó chưa có — không
// bao giờ để lộ ra "không có ví" phía khách hàng.
export const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (wallet) return wallet;

  const user = await User.findById(userId).select("fullName email");
  if (!user) throw makeError("Không tìm thấy người dùng", 404);

  return Wallet.create({ user: userId, userName: user.fullName, email: user.email, balance: 0 });
};

const addTransaction = (wallet, { type, amount, desc }) => {
  wallet.transactions.unshift({
    id: `W${Date.now()}`,
    type,
    amount,
    desc,
    date: new Date().toLocaleString("vi-VN"),
    status: "success",
  });
};

// POST /api/customer/wallet/topup/qr — chỉ sinh QR để hiển thị, KHÔNG cộng
// tiền ở bước này (cộng tiền thật diễn ra ở confirmTopup, sau khi bấm nút demo
// "đã chuyển khoản", giống hệt luồng thanh toán vé).
export const generateTopupQr = async (userId, amount) => {
  if (!Number.isFinite(amount) || amount < 10000) {
    throw makeError("Số tiền nạp tối thiểu là 10.000đ", 400);
  }

  const wallet = await getOrCreateWallet(userId);
  const transferContent = removeVietnameseTones(`Nap vi ${wallet._id.toString().slice(-8)}`);

  const qrImageUrl =
    `https://img.vietqr.io/image/${BANK_CONFIG.bankCode}-${BANK_CONFIG.accountNumber}-${VIETQR_TEMPLATE}.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  return {
    qrImageUrl,
    bankName: BANK_CONFIG.bankName,
    accountNumber: BANK_CONFIG.accountNumber,
    accountName: BANK_CONFIG.accountName,
    transferContent,
    amount,
  };
};

// POST /api/customer/wallet/topup/confirm — nút "Demo: đã chuyển khoản".
// Đây LÀ bước cộng tiền thật (không có cổng thanh toán thật đứng sau nên tin
// theo yêu cầu của client, đúng như bạn yêu cầu "nút demo để test").
export const confirmTopup = async (userId, amount) => {
  if (!Number.isFinite(amount) || amount < 10000) {
    throw makeError("Số tiền nạp tối thiểu là 10.000đ", 400);
  }

  const wallet = await getOrCreateWallet(userId);
  wallet.balance += amount;
  wallet.totalTopup += amount;
  addTransaction(wallet, { type: "topup", amount, desc: "Nạp tiền qua VietQR (demo)" });
  await wallet.save();

  return wallet;
};

// POST /api/customer/payments/bookings/:bookingId/pay-wallet — thanh toán vé
// bằng số dư ví thật (yêu cầu bổ sung: trừ ví khi mua vé). Bọc trong transaction
// + idempotent giống hệt createHold/confirmBankPaymentDemo — tiền thật di
// chuyển nên cần chặt tối thiểu ngang với giữ ghế.
export const payBookingWithWallet = async (userId, bookingId) => {
  const session = await mongoose.startSession();
  try {
    let result;

    await session.withTransaction(async () => {
      const booking = await Booking.findOne({ _id: bookingId, user: userId }).session(session);
      if (!booking) throw makeError("Không tìm thấy đơn đặt vé", 404);

      // Idempotent: gọi lại cho booking đã "confirmed" (double-click, mất mạng
      // giữa chừng rồi bấm lại) trả về luôn kết quả hiện tại, KHÔNG trừ ví lần 2.
      if (booking.status === "confirmed") {
        const existingWallet = await Wallet.findOne({ user: userId }).session(session);
        result = { booking, wallet: existingWallet };
        return;
      }

      if (booking.status !== "pending") {
        throw makeError("Đơn đặt vé không ở trạng thái chờ thanh toán", 400);
      }

      if (booking.expiresAt && booking.expiresAt.getTime() < Date.now()) {
        booking.status = "expired";
        await booking.save({ session });
        throw makeError("Đơn đặt vé đã hết hạn giữ chỗ", 410);
      }

      let wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        const user = await User.findById(userId).select("fullName email").session(session);
        if (!user) throw makeError("Không tìm thấy người dùng", 404);
        wallet = (
          await Wallet.create([{ user: userId, userName: user.fullName, email: user.email, balance: 0 }], { session })
        )[0];
      }

      if (wallet.balance < booking.totalAmount) {
        throw makeError("Số dư ví không đủ để thanh toán", 400);
      }

      wallet.balance -= booking.totalAmount;
      wallet.totalSpent += booking.totalAmount;
      addTransaction(wallet, {
        type: "payment",
        amount: -booking.totalAmount,
        desc: `Thanh toán vé ${booking.code}`,
      });
      await wallet.save({ session });

      booking.status = "confirmed";
      booking.paymentMethod = "wallet";
      await booking.save({ session });

      result = { booking, wallet };
    });

    if (result.booking.status === "confirmed") {
      await createTicketsForBooking(result.booking); // idempotent, ngoài transaction cũng an toàn
    }

    return result;
  } finally {
    await session.endSession();
  }
};

export default { getOrCreateWallet, generateTopupQr, confirmTopup, payBookingWithWallet };
