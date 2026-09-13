import mongoose from "mongoose";
import { deriveShowtimeFields } from "../utils/deriveShowtimeFields.js";

const { Schema } = mongoose;
const model = (name, schema) =>
  mongoose.models[name] ?? mongoose.model(name, schema);

const priceSchema = new Schema(
  { standard: Number, vip: Number, couple: Number },
  { _id: false },
);

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

    // ── Field MỚI, phục vụ chọn ghế/đặt vé thật ở phía khách hàng ──
    // Admin panel cũ chỉ set movie/cinema/room/date/time/seats/format/status —
    // 5 field dưới đây được TỰ SUY RA (xem utils/deriveShowtimeFields.js) từ
    // các field cũ đó, admin không cần biết gì về Auditorium/Seat.
    cinemaId: { type: Schema.Types.ObjectId, ref: "Cinema", default: null },
    auditoriumId: { type: Schema.Types.ObjectId, ref: "Auditorium", default: null },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    price: { type: priceSchema, default: undefined },
  },
  { timestamps: true, collection: "Showtime" },
);

// LƯU Ý: hook arity 0 (không dùng `next`) — xem giải thích chi tiết trong
// model/Movie.js. Riêng deriveShowtimeFields() đã tự bọc try/catch bên trong
// nên hook này gần như không bao giờ reject — admin panel không bị chặn dù
// dữ liệu rạp/phòng bị thiếu/sai.
showtimeSchema.pre("save", async function () {
  if (
    this.isNew ||
    this.isModified("cinema") ||
    this.isModified("room") ||
    this.isModified("date") ||
    this.isModified("time") ||
    this.isModified("seats") ||
    this.isModified("movie")
  ) {
    const derived = await deriveShowtimeFields(this.toObject());
    Object.assign(this, derived);
  }
});

showtimeSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() || {};
  const patch = update.$set ?? update;
  const relevantFields = ["cinema", "room", "date", "time", "seats", "movie"];
  if (!relevantFields.some((f) => patch[f] !== undefined)) return;

  const current = await this.model.findOne(this.getQuery()).lean();
  const merged = { ...current, ...patch };
  const derived = await deriveShowtimeFields(merged);

  if (Object.keys(derived).length > 0) {
    if (update.$set) Object.assign(update.$set, derived);
    else Object.assign(update, derived);
  }
});

export const Showtime = model("Showtime", showtimeSchema);
export default Showtime;
