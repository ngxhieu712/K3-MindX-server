import mongoose from "mongoose";

const { Schema } = mongoose;

const showtimeFormatSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["2d", "3d", "4dx", "imax", "screenx"],
      required: true,
    },

    audio: {
      type: String,
      enum: ["original", "vietnamese_dub"],
      default: "original",
    },

    subtitle: {
      type: Boolean,
      default: false,
    },

    subtitleLanguage: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const priceSchema = new Schema(
  {
    standard: {
      type: Number,
      required: true,
      min: 0,
    },

    vip: {
      type: Number,
      default: null,
      min: 0,
    },

    couple: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const showtimeSchema = new Schema(
  {
    movieId: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },

    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
      index: true,
    },

    auditoriumId: {
      type: Schema.Types.ObjectId,
      ref: "Auditorium",
      required: true,
      index: true,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    format: {
      type: showtimeFormatSchema,
      required: true,
    },

    price: {
      type: priceSchema,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "cancelled", "finished"],
      default: "available",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "Showtime",
  },
);

showtimeSchema.index({
  cinemaId: 1,
  startTime: 1,
});

showtimeSchema.index({
  movieId: 1,
  cinemaId: 1,
  startTime: 1,
});

showtimeSchema.index({
  auditoriumId: 1,
  startTime: 1,
});

export const Showtime = mongoose.model(
  "Showtime",
  showtimeSchema,
);

export default Showtime;