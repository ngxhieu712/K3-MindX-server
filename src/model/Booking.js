import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) =>
  mongoose.models[name] ?? mongoose.model(name, schema);

const seatDetailSchema = new Schema(
  {
    seatId: { type: Schema.Types.ObjectId, ref: "Seat", required: true },
    seatName: { type: String, required: true }, // "H7"
    seatType: { type: String, enum: ["standard", "vip", "couple"], default: "standard" },
    price: { type: Number, required: true }, // VNĐ, giá đúng loại ghế tại thời điểm đặt
  },
  { _id: false },
);

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
    // status: THÊM "pending" (đang giữ ghế chờ thanh toán) và "expired" (giữ
    // ghế quá hạn không thanh toán). "confirmed"/"completed"/"cancelled" giữ
    // nguyên như cũ để admin panel không cần đổi gì — 1 booking thanh toán
    // thành công (dù bằng ví hay chuyển khoản) sẽ chuyển thẳng sang "confirmed",
    // đúng với ý nghĩa "confirmed" mà admin panel đã hiểu từ trước.
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "expired"],
      default: "pending",
    },

    // ── Field MỚI, phục vụ luồng đặt vé thật (giữ ghế -> thanh toán) ──
    seatDetails: { type: [seatDetailSchema], default: [] }, // chi tiết từng ghế, tham chiếu Seat._id
    totalAmount: { type: Number, default: 0 }, // VNĐ thật (total = totalAmount/1000, làm tròn)
    expiresAt: { type: Date, default: null }, // hết hạn giữ ghế nếu còn "pending"
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", default: null },
    cinemaId: { type: Schema.Types.ObjectId, ref: "Cinema", default: null },
    auditoriumId: { type: Schema.Types.ObjectId, ref: "Auditorium", default: null },
    paymentMethod: { type: String, enum: ["bank", "wallet"], default: "bank" },
  },
  { timestamps: true, collection: "Booking" },
);

export const Booking = model("Booking", bookingSchema);
export default Booking;
