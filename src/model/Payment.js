// ---------------------------------------------------------------------
// 9. PAYMENT
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["momo", "vnpay", "zalopay", "card", "cash"], required: true },
  status: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending" },
  transactionRef: String,
  paidAt: Date,
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;