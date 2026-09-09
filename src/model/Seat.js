import mongoose from "mongoose";

const { Schema } = mongoose;

const seatSchema = new Schema(
  {
    auditoriumId: {
      type: Schema.Types.ObjectId,
      ref: "Auditorium",
      required: true,
      index: true,
    },

    row: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    number: {
      type: Number,
      required: true,
      min: 1,
    },

    type: {
      type: String,
      enum: ["standard", "vip", "couple"],
      default: "standard",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "Seat",
  },
);

seatSchema.index(
  {
    auditoriumId: 1,
    row: 1,
    number: 1,
  },
  {
    unique: true,
  },
);

export const Seat = mongoose.model("Seat", seatSchema);

export default Seat;