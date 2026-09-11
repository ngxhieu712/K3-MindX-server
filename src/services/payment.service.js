import { Booking } from "../models/Booking.js";
import { BANK_CONFIG, VIETQR_TEMPLATE } from "../config/constants.js";
import { removeVietnameseTones } from "../utils/removeVietnameseTones.js";

const makeError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// POST /api/payments/bookings/:bookingId/qr
// Sinh QR chuyển khoản TĨNH (không qua cổng thanh toán) dùng dịch vụ công khai
// VietQR quicklink (https://img.vietqr.io) — không cần API key.
// Số tiền LUÔN lấy từ booking.totalAmount đã tính ở server, không nhận amount
// từ client để tránh bị sửa giá trên FE.
export const generateQrPayment = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId });

  if (!booking) {
    throw makeError("Không tìm thấy đơn đặt vé", 404);
  }

  if (booking.status !== "pending") {
    throw makeError("Đơn đặt vé không ở trạng thái chờ thanh toán", 400);
  }

  if (booking.expiresAt && booking.expiresAt.getTime() < Date.now()) {
    booking.status = "expired";
    await booking.save();
    throw makeError("Đơn đặt vé đã hết hạn giữ chỗ", 410);
  }

  const transferContent = removeVietnameseTones(
    `Thanh toan don hang ${booking._id}`,
  );

  const qrImageUrl =
    `https://img.vietqr.io/image/${BANK_CONFIG.bankCode}-${BANK_CONFIG.accountNumber}-${VIETQR_TEMPLATE}.png` +
    `?amount=${booking.totalAmount}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  return {
    qrImageUrl,
    bankName: BANK_CONFIG.bankName,
    accountNumber: BANK_CONFIG.accountNumber,
    accountName: BANK_CONFIG.accountName,
    transferContent,
    amount: booking.totalAmount,
    expiresAt: booking.expiresAt,
  };
};

export default { generateQrPayment };
