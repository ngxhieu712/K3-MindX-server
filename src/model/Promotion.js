// ---------------------------------------------------------------------
// 7. PROMOTION
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const promotionSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["percent", "amount"], required: true },
  discountValue: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
},{ collection: "Promotion" });  // đặt tên collection là "Promotion" thay vì mặc định "promotions"

const Promotion = mongoose.model("Promotion", promotionSchema);
module.exports = Promotion;

