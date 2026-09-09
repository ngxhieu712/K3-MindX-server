import mongoose from "mongoose";

const { Schema } = mongoose;

const formatSchema = new Schema(
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

const trailerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    originalTitle: {
      type: String,
      default: null,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    posterUrl: {
      type: String,
      default: null,
    },

    bannerUrl: {
      type: String,
      default: null,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    releaseDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["now_showing", "coming_soon"],
      required: true,
      index: true,
    },

    ageRating: {
      type: String,
      enum: ["p", "k", "t13", "t16", "t18", "c"],
      required: true,
    },

    genres: {
      type: [String],
      default: [],
    },

    directors: {
      type: [String],
      default: [],
    },

    actors: {
      type: [String],
      default: [],
    },

    formats: {
      type: [formatSchema],
      default: [],
    },

    trailers: {
      type: [trailerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "Movie",
  },
);

movieSchema.index({
  title: "text",
  originalTitle: "text",
});

export const Movie = mongoose.model("Movie", movieSchema);

export default Movie;