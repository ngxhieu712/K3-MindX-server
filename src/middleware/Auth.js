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
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "demo-access-secret-please-change-me";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "demo-refresh-secret-please-change-me";

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // ngắn — dùng để gọi API
const REFRESH_TOKEN_EXPIRES_IN = "30d"; // dài — chỉ dùng để xin access token mới

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
    { sub: String(user.id ?? user._id), email: user.email, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, algorithm: "HS256" },
  );
}

export function generateRefreshToken(user) {
  const refreshToken = jwt.sign(
    { sub: String(user.id ?? user._id) }, // refresh token chỉ cần biết "user nào", không cần nhét nhiều thông tin
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN, algorithm: "HS256" },
  );
  validRefreshTokens.add(refreshToken); // đăng ký token này là "hợp lệ, đang hoạt động"
  return refreshToken;
}

const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày, khớp với controller/Auth.js

function setRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Xem giải thích chi tiết ở controller/Auth.js#setRefreshTokenCookie —
    // 2 nơi định nghĩa trùng hàm này nên phải sửa đồng bộ cả 2.
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

// FIX: bản gốc đọc refreshToken từ req.body, nhưng cookie được set httpOnly
// (JS phía client không đọc được để nhét vào body) và tra cứu user từ mảng
// `users` nội bộ luôn rỗng — refresh-token cũ trước đây LUÔN LUÔN thất bại.
// Ở đây: đọc refresh token từ cookie httpOnly, và tra user thật trong MongoDB.
export const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Thiếu refresh token" });
  }
  if (!validRefreshTokens.has(token)) {
    return res
      .status(403)
      .json({ message: "Refresh token không hợp lệ hoặc đã bị thu hồi" });
  }

  jwt.verify(
    token,
    REFRESH_TOKEN_SECRET,
    { algorithms: ["HS256"] },
    async (err, decoded) => {
      if (err) {
        validRefreshTokens.delete(token); // hết hạn thì dọn luôn cho sạch
        res.clearCookie("refreshToken");
        return res
          .status(403)
          .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
      }

      try {
        const user = await User.findById(decoded.sub);
        if (!user) {
          return res.status(403).json({ message: "User không tồn tại" });
        }

        // Rotate: thu hồi refresh token cũ, phát hành cặp token mới
        validRefreshTokens.delete(token);
        const newRefreshToken = generateRefreshToken(user);
        const newAccessToken = generateAccessToken(user);
        setRefreshTokenCookie(res, newRefreshToken);

        return res.status(200).json({
          accessToken: newAccessToken,
          user: {
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
          },
        });
      } catch (dbErr) {
        return res
          .status(500)
          .json({ message: "Lỗi máy chủ khi làm mới token" });
      }
    },
  );
};

export function authenticateToken(req, res, next) {
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
    return res
      .status(401)
      .json({
        message: "Authorization header sai định dạng, cần: Bearer <token>",
      });
  }
  jwt.verify(
    token,
    ACCESS_TOKEN_SECRET,
    { algorithms: ["HS256"] },
    (err, decoded) => {
      if (err) {
        // Token sai chữ ký hoặc đã hết hạn (hết hạn sau 15 phút — client
        // cần gọi /refresh-token để lấy access token mới, KHÔNG cần đăng
        // nhập lại bằng password).
        return res
          .status(403)
          .json({ message: "Access token không hợp lệ hoặc đã hết hạn" });
      }
      req.user = decoded; // { sub, username, role, iat, exp }
      next();
    },
  );
}

export function authorizeRole(...allowedRoles) {
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

// Tiện ích: gắn thẳng vào route admin, VD: router.get('/', requireAdmin, listMovies)
export const requireAdmin = [authenticateToken, authorizeRole("admin")];
