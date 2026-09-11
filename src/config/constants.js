// Thời gian giữ ghế tạm (phút) trước khi booking "pending" tự hết hạn.
export const BOOKING_HOLD_DURATION_MINUTES = Number(
  process.env.BOOKING_HOLD_DURATION_MINUTES || 10,
);

// Thông tin tài khoản ngân hàng nhận tiền — LẤY TỪ .env, không hardcode giá trị thật ở đây.
// BANK_CODE: mã ngân hàng theo chuẩn VietQR (BIN số, vd "970418" = BIDV,
//            hoặc mã ngắn như "BIDV", "VCB", "MB"... xem danh sách tại https://vietqr.io).
export const BANK_CONFIG = {
  bankCode: process.env.BANK_CODE,
  accountNumber: process.env.BANK_ACCOUNT_NUMBER,
  accountName: process.env.BANK_ACCOUNT_NAME, // nên IN HOA KHÔNG DẤU theo chuẩn ngân hàng
  bankName: process.env.BANK_DISPLAY_NAME || "",
};

// Kiểu giao diện ảnh QR của VietQR quicklink: compact | compact2 | qr_only | print
export const VIETQR_TEMPLATE = process.env.VIETQR_TEMPLATE || "compact2";
