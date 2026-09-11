import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) =>
  mongoose.models[name] ?? mongoose.model(name, schema);

const showtimeSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    movieTitle: { type: String, required: true }, // denormalized để list nhanh không cần populate
    cinema: { type: String, required: true }, // tên rạp, khớp Cinema.name
    room: { type: String, default: "" },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:mm"
    seats: { type: Number, default: 80 }, // tổng số ghế
    sold: { type: Number, default: 0 }, // số ghế đã bán
    format: { type: String, enum: ["2D", "3D", "IMAX", "4DX"], default: "2D" },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true, collection: "Showtime" },
);

export const Showtime = model("Showtime", showtimeSchema);
export default Showtime;
