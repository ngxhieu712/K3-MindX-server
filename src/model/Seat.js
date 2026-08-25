// ---------------------------------------------------------------------
// 3. SEAT: tách collection riêng vì số lượng lớn, cần query độc lập
// theo hallId khi vẽ sơ đồ ghế
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;
const seatSchema = new Schema({
  hallId: { type: Schema.Types.ObjectId, ref: "Hall", required: true },
  rowLabel: { type: String, required: true },     // "A", "B"...
  seatNumber: { type: Number, required: true },
  seatType: { type: String, enum: ["standard", "vip", "couple"], default: "standard" },
},{ collection: "Seat" });  // đặt tên collection là "Seat" thay vì mặc định "seats"
seatSchema.index({ hallId: 1, rowLabel: 1, seatNumber: 1 }, { unique: true });
 
const Seat = mongoose.model("Seat", seatSchema);
module.exports = Seat;