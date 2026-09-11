import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const cinemaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    chain: { type: String, required: true, trim: true }, // VD: "Beta", "CGV", "Galaxy", "Lotte", "Cinestar"
    color: { type: String, default: "#6c3fa0" }, // màu hiển thị theo hãng trên dashboard
    address: { type: String, default: "" },
  },
  { timestamps: true, collection: "Cinema" },
);

export const Cinema = model("Cinema", cinemaSchema);
export default Cinema;
