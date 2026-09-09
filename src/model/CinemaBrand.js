import mongoose from "mongoose";

const { Schema } = mongoose;

const cinemaBrandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    logoUrl: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "CinemaBrand",
  },
);

export const CinemaBrand = mongoose.model(
  "CinemaBrand",
  cinemaBrandSchema,
);

export default CinemaBrand;