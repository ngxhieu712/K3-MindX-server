import mongoose from "mongoose";
const { Schema } = mongoose;
 
// ---------------------------------------------------------------------
// 1. USER
// ---------------------------------------------------------------------
const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" },
}, { timestamps: true,
    collection: "User"
 });

const User = mongoose.model("User", userSchema);
module.exports = User;