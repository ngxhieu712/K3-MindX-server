import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const refundSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // "RF001"
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    ticketId: { type: String, default: "" },
    movie: { type: String, required: true },
    cinema: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    seats: { type: [String], default: [] },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    originalAmount: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    feePercent: { type: Number, default: 10 },
    requestedAt: { type: String, required: true },
    processedAt: { type: String, default: null },
    status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
    rejectReason: { type: String, default: "" },
  },
  { timestamps: true, collection: "Refund" },
);

export const Refund = model("Refund", refundSchema);
export default Refund;
