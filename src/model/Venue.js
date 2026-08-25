// ---------------------------------------------------------------------
// 2. VENUE (cụm rạp) - HALL (phòng chiếu) - embed hall ngay trong venue
// vì hall gần như không đổi và luôn được đọc cùng venue
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const hallSchema = new Schema({
  name: { type: String, required: true },     // vd: "Phòng 1", "IMAX"
  totalSeats: { type: Number, required: true },
},{ collection: "Hall" });  // đặt tên collection là "Hall" thay vì mặc định "halls"
 
const venueSchema = new Schema({
  name: { type: String, required: true },
  address: String,
  city: { type: String, required: true },
  halls: [hallSchema],
},{ collection: "Venue" });  // đặt tên collection là "Venue" thay vì mặc định "venues"

const Hall = mongoose.model("Hall", hallSchema);
const Venue = mongoose.model("Venue", venueSchema);

module.exports = { Venue, Hall };