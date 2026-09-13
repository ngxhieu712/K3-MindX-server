import mongoose from "mongoose";
import { computeShowingStatus } from "../utils/deriveMovieFields.js";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    genre: { type: String, default: "" },
    duration: { type: Number, default: 0 }, // phút
    age: { type: String, enum: ["P", "T13", "T16", "T18"], default: "T13" },
    // status: công tắc ẨN/HIỆN dùng cho admin panel — GIỮ NGUYÊN, không đổi nghĩa.
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    poster: { type: String, default: "" },

    // ── Field MỚI, phục vụ trang khách hàng (tab "Đang chiếu" / "Sắp chiếu") ──
    // Admin panel cũ không biết tới 2 field này và không bắt buộc phải set —
    // releaseDate mặc định = ngày tạo phim, showingStatus tự suy ra bên dưới.
    releaseDate: { type: Date, default: Date.now },
    showingStatus: {
      type: String,
      enum: ["now_showing", "coming_soon"],
      default: "now_showing",
    },
  },
  { timestamps: true, collection: "Movie" },
);

// Tự đồng bộ showingStatus theo releaseDate mỗi khi tạo/sửa phim, dù thao tác
// đến từ admin panel cũ (chỉ set title/genre/duration/age/status/poster) hay
// từ luồng mới — không ai cần nhớ set showingStatus tay.
// LƯU Ý: hook khai báo KHÔNG dùng tham số `next` (arity 0) — Mongoose sẽ tự
// đợi promise trả về (nếu là async) hoặc chạy xong đồng bộ rồi mới tiếp tục.
// Trộn `async function(next)` dễ gây lỗi rơi mất (unhandled rejection) vì khi
// đó Mongoose chỉ đợi next() được gọi, không đợi promise.
movieSchema.pre("save", function () {
  if (this.isModified("releaseDate") || this.isNew) {
    this.showingStatus = computeShowingStatus(this.releaseDate);
  }
});

movieSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  const nextReleaseDate = update.releaseDate ?? update.$set?.releaseDate;
  if (nextReleaseDate === undefined) return; // không đổi releaseDate -> khỏi tính lại

  const showingStatus = computeShowingStatus(nextReleaseDate);
  if (update.$set) update.$set.showingStatus = showingStatus;
  else update.showingStatus = showingStatus;
});

export const Movie = model("Movie", movieSchema);
export default Movie;
