import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) => mongoose.models[name] ?? mongoose.model(name, schema);

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    genre: { type: String, default: "" },
    duration: { type: Number, default: 0 }, // phút
    age: { type: String, enum: ["P", "T13", "T16", "T18"], default: "T13" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    poster: { type: String, default: "" },
  },
  { timestamps: true, collection: "Movie" },
);

export const Movie = model("Movie", movieSchema);
export default Movie;
