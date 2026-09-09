import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from './src/router/Auth.js';

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // đúng origin của client, KHÔNG dùng "*"
  credentials: true,
}));
app.use(cookieParser());

app.use(express.json());

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

app.use('/api/auth', authRouter);



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
