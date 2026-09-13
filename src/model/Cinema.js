import mongoose from "mongoose";
import { deriveCinemaFields } from "../utils/deriveCinemaFields.js";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const cinemaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    chain: { type: String, required: true, trim: true }, // VD: "Beta", "CGV", "Galaxy", "Lotte", "Cinestar"
    color: { type: String, default: "#6c3fa0" }, // màu hiển thị theo hãng trên dashboard
    address: { type: String, default: "" },

    // ── Field MỚI, phục vụ trang khách hàng (lọc theo hãng/khu vực) ──
    // Admin panel cũ chỉ set name/chain/color/address — brandId tự suy ra từ
    // `chain`; districtId cố gắng dò trong `address`, không chắc thì để trống.
    brandId: { type: Schema.Types.ObjectId, ref: "CinemaBrand", default: null },
    districtId: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "Cinema" },
);

// LƯU Ý: hook arity 0 (không dùng `next`) — xem giải thích chi tiết trong
// model/Movie.js. Lỗi bên trong (vd DB lỗi) sẽ tự động làm reject save()/
// findOneAndUpdate(), người gọi (controller) bắt lỗi như bình thường.
cinemaSchema.pre("save", async function () {
  if (this.isModified("chain") || this.isModified("address") || this.isNew) {
    const derived = await deriveCinemaFields(this);
    Object.assign(this, derived);
  }
});

cinemaSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() || {};
  const patch = update.$set ?? update;
  if (patch.chain === undefined && patch.address === undefined) return;

  // Lấy document hiện có để merge, vì findOneAndUpdate chỉ cho biết phần thay đổi.
  const current = await this.model.findOne(this.getQuery()).lean();
  const merged = { ...current, ...patch };
  const derived = await deriveCinemaFields(merged);

  if (Object.keys(derived).length > 0) {
    if (update.$set) Object.assign(update.$set, derived);
    else Object.assign(update, derived);
  }
});

export const Cinema = model("Cinema", cinemaSchema);
export default Cinema;
