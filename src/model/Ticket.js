import mongoose from "mongoose";

const { Schema } = mongoose;

const ticketSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
      index: true,
    },

    seatId: {
      type: Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },

    seatName: {
      type: String,
      required: true,
      trim: true,
    },

    ticketCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    qrCode: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "valid",
        "used",
        "cancelled",
      ],
      default: "valid",
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Ticket",
  },
);

ticketSchema.index({
  showtimeId: 1,
  seatId: 1,
});

export const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;