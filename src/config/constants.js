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

// ── Các giá trị Showtime.status (enum cũ, giữ nguyên để không phá admin panel)
// được coi là "còn có thể đặt vé" ở phía khách hàng. "completed"/"cancelled"
// thì không cho đặt nữa.
export const BOOKABLE_SHOWTIME_STATUSES = ["upcoming", "active"];

// Giá vé mặc định (VNĐ) khi 1 Showtime chưa được set field `price` — áp dụng
// cho suất chiếu tạo từ admin panel cũ (vốn không có khái niệm giá theo loại ghế).
export const DEFAULT_SHOWTIME_PRICE = {
  standard: Number(process.env.DEFAULT_PRICE_STANDARD || 75000),
  vip: Number(process.env.DEFAULT_PRICE_VIP || 95000),
  couple: Number(process.env.DEFAULT_PRICE_COUPLE || 150000),
};

// Thời lượng phim mặc định (phút) khi không tra được Movie.duration — dùng để
// tính endTime của suất chiếu.
export const DEFAULT_MOVIE_DURATION_MINUTES = 120;

// Thời gian đệm (dọn phòng/quảng cáo) cộng thêm sau khi phim kết thúc.
export const SHOWTIME_END_BUFFER_MINUTES = 15;

// Phí khi khách yêu cầu hoàn vé (trừ trên tổng tiền vé) — khớp REFUND_FEE_PERCENT
// phía client (data/mockData.js) để 2 bên tính cùng 1 con số.
export const REFUND_FEE_PERCENT = 10;
