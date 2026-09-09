import { User } from "../model/User.js";

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Trong thực tế đây phải là biến môi trường (process.env.ACCESS_TOKEN_SECRET),
// KHÔNG bao giờ hardcode secret thật vào code.
// Dùng 2 secret KHÁC NHAU cho access token và refresh token — nếu 1 cái lỡ lộ,
// cái còn lại vẫn an toàn.
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "demo-access-secret-please-change-me";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "demo-refresh-secret-please-change-me";

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // ngắn — dùng để gọi API
const REFRESH_TOKEN_EXPIRES_IN = "30d"; // dài — chỉ dùng để xin access token mới

const users = [];
// users item: { id, username, hashPassword, role }

// Nơi lưu các refresh token đang "còn sống" — để có thể THU HỒI (revoke) khi
// user logout, thay vì cứ để nó tự sống tới khi hết hạn. Thực tế nên lưu
// trong DB (kèm userId, thiết bị, ngày tạo...), ở đây dùng Set cho demo.
export const validRefreshTokens = new Set();

/* ============================================================================
 *  🔐 Helper: tạo access token & refresh token
 *  ----------------------------------------------------------------------
 *  Tách thành 2 hàm riêng cho dễ đọc, và vì chúng dùng SECRET + thời hạn
 *  khác nhau. Chỉ định rõ `algorithm` để tránh rủi ro "algorithm confusion"
 *  đã nói ở phần trước.
 * ==========================================================================*/
export function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, algorithm: "HS256" }
  );
}

export function generateRefreshToken(user) {
  const refreshToken = jwt.sign(
    { sub: user.id }, // refresh token chỉ cần biết "user nào", không cần nhét nhiều thông tin
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN, algorithm: "HS256" }
  );
  validRefreshTokens.add(refreshToken); // đăng ký token này là "hợp lệ, đang hoạt động"
  return refreshToken;
}



export const refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Thiếu refresh token" });
  }
  if (!validRefreshTokens.has(refreshToken)) {
    return res.status(403).json({ message: "Refresh token không hợp lệ hoặc đã bị thu hồi" });
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
    if (err) {
      validRefreshTokens.delete(refreshToken); // hết hạn thì dọn luôn cho sạch
      return res.status(403).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    const user = users.find((u) => u.id === decoded.sub);
    if (!user) {
      return res.status(403).json({ message: "User không tồn tại" });
    }
    const newRefreshToken = generateRefreshToken(user);
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // ⚠️ client PHẢI lưu đè lên token cũ
    });
  });
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]; // đây là header HTTP Authentication

  if (!authHeader) {
    // Báo cho client biết: "mày cần xác thực bằng scheme Bearer"
    res.set("WWW-Authenticate", 'Bearer realm="Access to protected resources"');
    return res.status(401).json({ message: "Thiếu Authorization header" });
  }

  // Header đúng chuẩn có dạng: "Bearer eyJhbGciOi..."
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.set("WWW-Authenticate", 'Bearer realm="Access to protected resources"');
    return res.status(401).json({ message: "Authorization header sai định dạng, cần: Bearer <token>" });
  }
  jwt.verify(token, ACCESS_TOKEN_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
    if (err) {
      // Token sai chữ ký hoặc đã hết hạn (hết hạn sau 15 phút — client
      // cần gọi /refresh-token để lấy access token mới, KHÔNG cần đăng
      // nhập lại bằng password).
      return res.status(403).json({ message: "Access token không hợp lệ hoặc đã hết hạn" });
    }
    req.user = decoded; // { sub, username, role, iat, exp }
    next();
  });
}


function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Phòng trường hợp middleware này bị dùng mà quên gọi authenticateToken trước
      return res.status(401).json({ message: "Chưa xác thực" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không đủ quyền truy cập" });
    }
    next();
  };
}

