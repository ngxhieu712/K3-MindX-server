import mongoose from "mongoose";

const { Schema } = mongoose;
const model = (name, schema) =>
  mongoose.models[name] ?? mongoose.model(name, schema);

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashPassword: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
    },
  },
  { timestamps: true, collection: "User" },
);

export const User = model("User", userSchema);
export default User;