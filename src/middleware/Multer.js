// middleware/multer.js
// Middleware xử lý upload file: nhận file từ client rồi đẩy thẳng lên Cloudinary
// (không lưu file tạm trên ổ đĩa server)

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// ==== 1. Cấu hình Cloudinary ====
// Các giá trị này lấy từ Cloudinary Dashboard, lưu trong file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==== 2. Cấu hình storage engine cho multer ====
// Thay vì dùng diskStorage (lưu vào ổ cứng), ta dùng CloudinaryStorage
// để multer tự động upload file lên Cloudinary ngay khi nhận được
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'finaltestK3/teacher-info', // folder trên Cloudinary sẽ chứa các file này
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Tạo public_id (tên file trên Cloudinary) không trùng nhau
    public_id: (req, file) => {
      const nameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
      return `${Date.now()}-${nameWithoutExt}`;
    },
  },
});

// ==== 3. Lọc loại file được phép upload ====
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValidMime = allowedTypes.test(file.mimetype);

  if (isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh định dạng jpeg, jpg, png, webp'), false);
  }
};

// ==== 4. Khởi tạo middleware multer ====
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // giới hạn 5MB mỗi file
  },
});

export default upload;
