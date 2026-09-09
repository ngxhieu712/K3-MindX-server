import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSeatSchema = new Schema(
  {
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

    seatType: {
      type: String,
      enum: ["standard", "vip", "couple"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const bookingSchema = new Schema(
  {
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

    movieId: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
    },

    auditoriumId: {
      type: Schema.Types.ObjectId,
      ref: "Auditorium",
      required: true,
    },

    seats: {
      type: [bookingSeatSchema],
      required: true,
      validate: {
        validator: (seats) => seats.length > 0,
        message: "Booking must contain at least one seat",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "cancelled",
        "expired",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "momo",
        "vnpay",
        "bank_transfer",
        "cash",
      ],
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Booking",
  },
);

bookingSchema.index({
  userId: 1,
  createdAt: -1,
});

bookingSchema.index({
  showtimeId: 1,
  status: 1,
});

export const Booking = mongoose.model(
  "Booking",
  bookingSchema,
);

export default Booking;