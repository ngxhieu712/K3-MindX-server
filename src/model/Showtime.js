// ---------------------------------------------------------------------
// 5. SHOWTIME
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const showtimeSchema = new Schema({
  movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
  hallId: { type: Schema.Types.ObjectId, ref: "Hall", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  basePrice: { type: Number, required: true },
},{ collection: "Showtime" });  // đặt tên collection là "Showtime" thay vì mặc định "showtimes"

showtimeSchema.index({ movieId: 1, startTime: 1 });
showtimeSchema.index({ hallId: 1, startTime: 1 });

const Showtime = mongoose.model("Showtime", showtimeSchema);
module.exports = Showtime;
 