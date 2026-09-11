import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) =>
  mongoose.models[name] ?? mongoose.model(name, schema);

const bookingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // "BK001", hiển thị cho admin/khách
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true }, // denormalized
    showtime: { type: Schema.Types.ObjectId, ref: "Showtime" },
    movie: { type: String, required: true },
    cinema: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    seats: { type: [String], default: [] },
    total: { type: Number, required: true }, // đơn vị: nghìn đồng (K), khớp UI hiện tại
    status: {
      type: String,
      enum: ["confirmed", "completed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true, collection: "Booking" },
);

export const Booking = model("Booking", bookingSchema);
export default Booking;
