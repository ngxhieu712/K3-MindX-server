// ---------------------------------------------------------------------
// 4. MOVIE
// ---------------------------------------------------------------------
import mongoose from "mongoose";
const { Schema } = mongoose;

const movieSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  durationMin: { type: Number, required: true },
  genre: String,
  posterUrl: String,
  releaseDate: Date,
},{ collection: "Movie" });  // đặt tên collection là "Movie" thay vì mặc định "movies"

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;