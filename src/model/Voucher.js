import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount: { type: Number, required: true },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    description: { type: String, default: "" },
    minOrder: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive", "expired"], default: "active" },
    appliesTo: { type: String, default: "Tất cả" }, // "Tất cả" | tên hãng rạp
  },
  { timestamps: true, collection: "Voucher" },
);

export const Voucher = model("Voucher", voucherSchema);
export default Voucher;
