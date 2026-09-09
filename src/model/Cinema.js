import mongoose from "mongoose";

const { Schema } = mongoose;

const cinemaSchema = new Schema(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "CinemaBrand",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    location: {
      city: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      district: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },
    },

    phoneNumber: {
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
    collection: "Cinema",
  },
);

cinemaSchema.index({
  "location.city": 1,
  "location.district": 1,
});

export const Cinema = mongoose.model("Cinema", cinemaSchema);

export default Cinema;