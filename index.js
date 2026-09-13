import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from './src/router/Auth.js';
import movieRouter from './src/router/Movie.js';
import venueRouter from './src/router/Venue.js';
import showtimeRouter from './src/router/Showtime.js';
import bookingRouter from './src/router/Booking.js';
import userRouter from './src/router/User.js';
import promotionRouter from './src/router/Promotion.js';
import refundRouter from './src/router/Refund.js';
import walletRouter from './src/router/Wallet.js';
import bannerRouter from './src/router/Banner.js';
import statsRouter from './src/router/Stats.js';
// Router "khách hàng" (luồng đặt vé thật: phim/rạp/suất chiếu/ghế/booking/QR).
// Mount dưới prefix riêng /api/customer để KHÔNG đụng route admin nào ở trên.
import customerRouter from './src/router/customer.index.js';

const app = express();

// Danh sách origin được phép gọi API — client (khách hàng, 5173) và admin (5174).
// Có thể override qua biến môi trường CLIENT_ORIGIN / ADMIN_ORIGIN nếu deploy khác cổng.
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_ORIGIN || "http://localhost:5174",
  "https://k3-mind-x-adminweb.vercel.app",
  "https://k3-mind-x-client.vercel.app"
];

app.use(cors({
  origin: ALLOWED_ORIGINS, // KHÔNG dùng "*" vì credentials:true yêu cầu origin cụ thể
  credentials: true,
}));
app.use(cookieParser());

app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

app.use('/api/auth', authRouter);
app.use('/api/movies', movieRouter);
app.use('/api/cinemas', venueRouter);
app.use('/api/showtimes', showtimeRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/users', userRouter);
app.use('/api/vouchers', promotionRouter);
app.use('/api/refunds', refundRouter);
app.use('/api/wallets', walletRouter);
app.use('/api/banners', bannerRouter);
app.use('/api/stats', statsRouter);
app.use('/api/customer', customerRouter);



// 404 cho route không tồn tại
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy endpoint" });
});

// Error handler tập trung — Express 5 tự động forward lỗi ném ra (kể cả trong
// async handler) tới đây, nên các controller không cần try/catch thủ công.
app.use((err, req, res, next) => {
  console.error(err);
  if (err?.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  res.status(err?.status || 500).json({ message: err?.message || "Lỗi máy chủ" });
});

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: "ticket_booking_mindx",              // phải khai báo dbName muốn kết nối nếu không mongoose sẽ mặc định kết nối tới db test
        });
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

startServer();
