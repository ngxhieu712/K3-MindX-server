// 6. SEAT_HOLD: giữ ghế tạm trong lúc thanh toán
// -> unique index chống 2 người giữ cùng 1 ghế cùng lúc (atomic insert)
// -> TTL index tự xóa document khi hết hạn, KHÔNG cần cron job
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const seatHoldSchema = new Schema({
  showtimeId: { type: Schema.Types.ObjectId, ref: "Showtime", required: true },
  seatId: { type: Schema.Types.ObjectId, ref: "Seat", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },   // vd: now + 5 phút
}, { timestamps: true,
    collection: "SeatHold"
 });
seatHoldSchema.index({ showtimeId: 1, seatId: 1 }, { unique: true });
seatHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
 
const SeatHold = mongoose.model("SeatHold", seatHoldSchema);
module.exports = SeatHold;