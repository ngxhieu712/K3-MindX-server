import mongoose from "mongoose";

const { Schema } = mongoose;

const locationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["city", "district"],
      required: true,
      index: true,
    },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "Location",
  },
);

locationSchema.index({
  parentId: 1,
  type: 1,
});

export const Location = mongoose.model("Location", locationSchema);

export default Location;
