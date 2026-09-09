import mongoose from "mongoose";

const { Schema } = mongoose;

const auditoriumSchema = new Schema(
  {
    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["standard", "vip", "imax", "4dx", "screenx"],
      default: "standard",
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "Auditorium",
  },
);

auditoriumSchema.index(
  {
    cinemaId: 1,
    code: 1,
  },
  {
    unique: true,
  },
);

export const Auditorium = mongoose.model(
  "Auditorium",
  auditoriumSchema,
);

export default Auditorium;