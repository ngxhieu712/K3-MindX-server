// ---------------------------------------------------------------------
// 8. BOOKING: embed danh sách ghế đã đặt ngay trong booking (đọc chung)
// nhưng vẫn cần collection bookingSeats riêng để giữ UNIQUE toàn cục
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSeatSubSchema = new Schema({
  seatId: { type: Schema.Types.ObjectId, ref: "Seat", required: true },
  price: { type: Number, required: true },
}, { _id: false });
 
const bookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  showtimeId: { type: Schema.Types.ObjectId, ref: "Showtime", required: true },
  promotionId: { type: Schema.Types.ObjectId, ref: "Promotion" },
  bookingCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled", "expired"], default: "pending" },
  totalAmount: { type: Number, required: true },
  seats: [bookingSeatSubSchema],
}, { timestamps: true });
bookingSchema.index({ userId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;