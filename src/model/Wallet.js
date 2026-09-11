import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const transactionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["topup", "payment", "refund"], required: true },
    amount: { type: Number, required: true }, // dương = cộng, âm = trừ
    desc: { type: String, default: "" },
    date: { type: String, required: true },
    status: { type: String, enum: ["success", "pending", "failed"], default: "success" },
  },
  { _id: false },
);

const walletSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    balance: { type: Number, default: 0 },
    totalTopup: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalRefunded: { type: Number, default: 0 },
    transactions: { type: [transactionSchema], default: [] },
  },
  { timestamps: true, collection: "Wallet" },
);

export const Wallet = model("Wallet", walletSchema);
export default Wallet;
