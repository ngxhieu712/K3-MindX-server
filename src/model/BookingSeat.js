// Collection riêng chỉ để enforce "1 ghế/1 showtime không được đặt 2 lần"
// khi booking chuyển sang trạng thái confirmed
import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSeatSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  showtimeId: { type: Schema.Types.ObjectId, ref: "Showtime", required: true },
  seatId: { type: Schema.Types.ObjectId, ref: "Seat", required: true },
});
bookingSeatSchema.index({ showtimeId: 1, seatId: 1 }, { unique: true });

const BookingSeat = mongoose.model("BookingSeat", bookingSeatSchema);
module.exports = BookingSeat;