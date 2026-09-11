import bcrypt from "bcrypt";
import { User } from "../model/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  validRefreshTokens, // giả định đây là Set<string> — đổi lại nếu Auth.js dùng cấu trúc khác
} from "../middleware/Auth.js";

const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngày

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

const toPublicUser = (user) => ({
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
});

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
  }

  const isMatch = await bcrypt.compare(password, user.hashPassword);
  if (!isMatch) {
    return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
  }

  if (user.status === "locked") {
    return res.status(403).json({ message: "Tài khoản đã bị khóa" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  validRefreshTokens.add(refreshToken);
  setRefreshTokenCookie(res, refreshToken);

  return res.status(200).json({
    message: "Đăng nhập thành công",
    accessToken, // hết hạn 15 phút — client gắn vào header Authorization
    user: toPublicUser(user),
  });
};

export const register = async (req, res) => {
  const { fullName, phoneNumber, email, password, role } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  const existed = await User.findOne({ email: email.toLowerCase() });
  if (existed) {
    return res.status(409).json({ message: "Email đã tồn tại" });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    fullName,
    phoneNumber,
    email,
    hashPassword,
    role: role === "admin" ? "admin" : "customer", // khoá cứng, client không tự set admin được
  });

  // đăng ký xong tự động đăng nhập
  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);
  validRefreshTokens.add(refreshToken);
  setRefreshTokenCookie(res, refreshToken);

  return res.status(201).json({
    message: "Đăng ký thành công",
    accessToken,
    user: toPublicUser(newUser),
  });
};

export const logout = (req, res) => {
  const { refreshToken } = req.cookies || {};
  if (refreshToken) validRefreshTokens.delete(refreshToken);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Đăng xuất thành công" });
};