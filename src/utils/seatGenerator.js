// Sinh sơ đồ ghế MẶC ĐỊNH cho 1 phòng chiếu (Auditorium) mới được tạo tự động
// (xem model/Showtime.js — hook tự tạo Auditorium từ field `room` cũ).
//
// QUY ƯỚC MẶC ĐỊNH (đơn giản hoá, có thể chỉnh tay sau trong DB nếu cần):
// - Mỗi hàng có `SEATS_PER_ROW` ghế, hàng được đặt tên A, B, C... theo capacity.
// - 2 hàng cuối cùng (gần màn hình... thật ra là xa màn hình nhất, hàng sau)
//   được đánh dấu type "vip", còn lại là "standard".
// - Chưa tự sinh ghế đôi ("couple") vì loại ghế này thường chiếm 2 vị trí vật lý
//   cho 1 lượt đặt — cần thiết kế riêng, có thể bổ sung tay sau nếu rạp cần.
import { Seat } from "../model/Seat.js";

export const SEATS_PER_ROW = 10;
const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export async function generateSeatsForAuditorium(auditoriumId, capacity = 80) {
  const totalRows = Math.max(1, Math.ceil(capacity / SEATS_PER_ROW));
  const vipRowsCount = totalRows >= 4 ? 2 : 0; // phòng quá nhỏ thì thôi, khỏi chia VIP

  const seatDocs = [];
  let remaining = capacity;

  for (let r = 0; r < totalRows; r++) {
    const rowLetter = ROW_LETTERS[r] || `R${r + 1}`;
    const seatsInThisRow = Math.min(SEATS_PER_ROW, remaining);
    const isVipRow = r >= totalRows - vipRowsCount;

    for (let n = 1; n <= seatsInThisRow; n++) {
      seatDocs.push({
        auditoriumId,
        row: rowLetter,
        number: n,
        type: isVipRow ? "vip" : "standard",
        isActive: true,
      });
    }
    remaining -= seatsInThisRow;
  }

  if (seatDocs.length === 0) return [];
  return Seat.insertMany(seatDocs, { ordered: false }).catch((err) => {
    // Nếu đã tồn tại ghế cho phòng này (unique index auditoriumId+row+number)
    // thì bỏ qua lỗi trùng — coi như đã sinh sẵn từ trước.
    if (err?.code === 11000) return [];
    throw err;
  });
}

export default generateSeatsForAuditorium;
