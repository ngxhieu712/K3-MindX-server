import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const bannerSchema = new Schema(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    cta: { type: String, default: "Xem ngay" },
    badge: { type: String, default: "" },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
  },
  { timestamps: true, collection: "Banner" },
);

export const Banner = model("Banner", bannerSchema);
export default Banner;
