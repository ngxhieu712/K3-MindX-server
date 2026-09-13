// Script seed dữ liệu mẫu vào MongoDB.
// Phải thêm "seed": "node src/seed.js" vào package.json mới chạy được (đã có sẵn).
//
// Chạy:  npm run seed
// Yêu cầu MONGODB_URI trong .env đã trỏ đúng database.
//
// ĐÃ CẬP NHẬT (giai đoạn B1 — hoàn thiện schema chuẩn hoá song song):
// - Seed thêm Location (cây Thành phố/Quận huyện) + CinemaBrand, gán trực tiếp
//   brandId/districtId cho Cinema (không cần chờ hook đoán, seed thì biết chắc).
// - Movie seed thêm releaseDate + showingStatus (đủ dữ liệu cho tab
//   "Đang chiếu" / "Sắp chiếu" phía khách hàng) + 2 phim "Sắp chiếu" mới.
// - Showtime vẫn tạo bằng Showtime.create() (không dùng insertMany) để hook
//   model/Showtime.js TỰ chạy: tìm/tạo đúng 1 Auditorium theo (cinema, room)
//   + tự sinh sơ đồ ghế thật cho phòng đó + tính startTime/endTime/price.
// - Thêm bước "lấp ghế đã bán" cho từng suất chiếu bằng Booking thật có
//   seatDetails trỏ tới Seat thật, để số ghế trống hiển thị đúng ngay từ đầu
//   khi test tính năng "ghế inActive khi đã có người mua" (yêu cầu #3).
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import { User } from "./model/User.js";
import { Cinema } from "./model/Cinema.js";
import { CinemaBrand } from "./model/CinemaBrand.js";
import { Location } from "./model/Location.js";
import { Movie } from "./model/Movie.js";
import { Showtime } from "./model/Showtime.js";
import { Auditorium } from "./model/Auditorium.js";
import { Seat } from "./model/Seat.js";
import { Booking } from "./model/Booking.js";
import { Voucher } from "./model/Voucher.js";
import { Refund } from "./model/Refund.js";
import { Wallet } from "./model/Wallet.js";
import { Banner } from "./model/Banner.js";
import { genCode } from "./utils/genCode.js";
import { slugify } from "./utils/slugify.js";

dotenv.config();

const ADMIN_EMAIL = "admin@hncinema.vn";
const ADMIN_PASSWORD = "Admin@123";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "ticket_booking_mindx" });
  console.log("Connected to MongoDB — bắt đầu seed...");

  // Xoá sạch dữ liệu cũ (cả collection admin panel lẫn collection mới)
  await Promise.all([
    User.deleteMany({}),
    Cinema.deleteMany({}),
    CinemaBrand.deleteMany({}),
    Location.deleteMany({}),
    Movie.deleteMany({}),
    Showtime.deleteMany({}),
    Auditorium.deleteMany({}),
    Seat.deleteMany({}),
    Booking.deleteMany({}),
    Voucher.deleteMany({}),
    Refund.deleteMany({}),
    Wallet.deleteMany({}),
    Banner.deleteMany({}),
  ]);

  // ── USERS (admin + 10 khách hàng, khớp id 1..10 trong mockData.js) ──
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const customerHash = await bcrypt.hash("customer123", 10);

  const admin = await User.create({
    fullName: "Quản trị viên", email: ADMIN_EMAIL, phoneNumber: "0900000000",
    hashPassword: adminHash, role: "admin", status: "active",
  });

  const customerSeed = [
    { name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", phone: "0901234567", status: "active" },
    { name: "Trần Thị Bình", email: "binh.tran@gmail.com", phone: "0912345678", status: "active" },
    { name: "Lê Minh Cường", email: "cuong.le@gmail.com", phone: "0923456789", status: "active" },
    { name: "Phạm Thu Dung", email: "dung.pham@gmail.com", phone: "0934567890", status: "locked" },
    { name: "Hoàng Văn Đức", email: "duc.hoang@gmail.com", phone: "0945678901", status: "active" },
    { name: "Vũ Thị Fương", email: "fuong.vu@gmail.com", phone: "0956789012", status: "active" },
    { name: "Đặng Quốc Gia", email: "gia.dang@gmail.com", phone: "0967890123", status: "active" },
    { name: "Bùi Thanh Hà", email: "ha.bui@gmail.com", phone: "0978901234", status: "active" },
    { name: "Cao Minh Hiếu", email: "hieu.cao@gmail.com", phone: "0989012345", status: "locked" },
    { name: "Đinh Thị Lan", email: "lan.dinh@gmail.com", phone: "0990123456", status: "active" },
  ];

  const users = []; // users[0] = mock id 1, users[1] = mock id 2, ...
  for (const u of customerSeed) {
    const doc = await User.create({
      fullName: u.name, email: u.email, phoneNumber: u.phone,
      hashPassword: customerHash, role: "customer", status: u.status,
    });
    users.push(doc);
  }
  const byName = (name) => users.find((u) => u.fullName === name);

  // ── LOCATIONS (Thành phố -> Quận/huyện) ──
  const hanoi = await Location.create({ name: "Hà Nội", type: "city", slug: slugify("Hà Nội") });
  const districtNames = ["Thanh Xuân", "Cầu Giấy", "Nam Từ Liêm", "Đống Đa", "Hai Bà Trưng", "Hà Đông", "Long Biên"];
  const districts = {};
  for (const name of districtNames) {
    districts[name] = await Location.create({
      name, type: "district", parentId: hanoi._id, slug: slugify(name),
    });
  }

  // ── CINEMA BRANDS ──
  const brandSeed = [
    { name: "Beta", color: "#005b9f" },
    { name: "CGV", color: "#e60012" },
    { name: "Galaxy", color: "#6c3fa0" },
    { name: "Lotte", color: "#e8001c" },
    { name: "Cinestar", color: "#ff6b00" },
  ];
  const brands = {};
  for (const b of brandSeed) {
    brands[b.name] = await CinemaBrand.create({ name: b.name, slug: slugify(b.name) });
  }

  // ── CINEMAS ── (address chứa tên quận để khớp brandId/districtId ngay, không
  // cần chờ hook tự đoán — nhưng field `chain`/`address` cũ vẫn giữ nguyên để
  // admin panel không cần đổi gì)
  const cinemaSeed = [
    { name: "Beta Thanh Xuân", chain: "Beta", color: "#005b9f", address: "12 Nguyễn Trãi, Thanh Xuân, Hà Nội", district: "Thanh Xuân" },
    { name: "Beta Mỹ Đình", chain: "Beta", color: "#005b9f", address: "Tòa CT2, Mỹ Đình, Nam Từ Liêm, Hà Nội", district: "Nam Từ Liêm" },
    { name: "Beta Tây Sơn", chain: "Beta", color: "#005b9f", address: "62 Tây Sơn, Đống Đa, Hà Nội", district: "Đống Đa" },
    { name: "CGV Vincom Bà Triệu", chain: "CGV", color: "#e60012", address: "191 Bà Triệu, Hai Bà Trưng, Hà Nội", district: "Hai Bà Trưng" },
    { name: "CGV AEON Hà Đông", chain: "CGV", color: "#e60012", address: "Dương Nội, Hà Đông, Hà Nội", district: "Hà Đông" },
    { name: "CGV Vincom Nguyễn Chí Thanh", chain: "CGV", color: "#e60012", address: "54 Nguyễn Chí Thanh, Đống Đa, Hà Nội", district: "Đống Đa" },
    { name: "Galaxy Nguyễn Du", chain: "Galaxy", color: "#6c3fa0", address: "116 Nguyễn Du, Hai Bà Trưng, Hà Nội", district: "Hai Bà Trưng" },
    { name: "Galaxy Mipec Long Biên", chain: "Galaxy", color: "#6c3fa0", address: "Mipec, Long Biên, Hà Nội", district: "Long Biên" },
    { name: "Lotte Cinema Đống Đa", chain: "Lotte", color: "#e8001c", address: "229 Tây Sơn, Đống Đa, Hà Nội", district: "Đống Đa" },
    { name: "Lotte Cinema Long Biên", chain: "Lotte", color: "#e8001c", address: "Aeon Mall, Long Biên, Hà Nội", district: "Long Biên" },
    { name: "Cinestar Hai Bà Trưng", chain: "Cinestar", color: "#ff6b00", address: "271 Nguyễn Trãi, Hai Bà Trưng, Hà Nội", district: "Hai Bà Trưng" },
  ];
  await Cinema.insertMany(
    cinemaSeed.map(({ district, ...c }) => ({
      ...c,
      brandId: brands[c.chain]._id,
      districtId: districts[district]._id,
      isActive: true,
    })),
  );

  // ── MOVIES ── (thêm releaseDate + showingStatus tường minh — không phụ thuộc
  // hook vì insertMany không chạy pre('save'))
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  const daysFromNow = (n) => new Date(Date.now() + n * 86400000);
  const movieSeed = [
    { title: "Nghỉ Hè Sợ Nghỉ Hưu", genre: "Gia đình, Hài hước", duration: 117, age: "T13", status: "active", poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300&q=80", releaseDate: daysAgo(20), showingStatus: "now_showing" },
    { title: "Người Nhện: Khởi Đầu Mới", genre: "Hành động, Phiêu lưu", duration: 145, age: "T13", status: "active", poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&q=80", releaseDate: daysAgo(15), showingStatus: "now_showing" },
    { title: "Hộ Linh Tráng Sĩ", genre: "Hành động, Lịch sử", duration: 155, age: "T13", status: "active", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80", releaseDate: daysAgo(10), showingStatus: "now_showing" },
    { title: "Phim Shin", genre: "Hoạt hình", duration: 101, age: "P", status: "active", poster: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=300&q=80", releaseDate: daysAgo(8), showingStatus: "now_showing" },
    { title: "Insidious: Quỷ Quyết", genre: "Kinh dị", duration: 103, age: "T16", status: "active", poster: "https://images.unsplash.com/photo-1505635552518-3448ff116af3?w=300&q=80", releaseDate: daysAgo(5), showingStatus: "now_showing" },
    { title: "The Odyssey", genre: "Hành động, Phiêu lưu", duration: 173, age: "T16", status: "active", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&q=80", releaseDate: daysAgo(3), showingStatus: "now_showing" },
    { title: "Chính Thức Khởi Chiếu", genre: "Hoạt hình, Gia đình", duration: 110, age: "T13", status: "inactive", poster: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80", releaseDate: daysAgo(1), showingStatus: "now_showing" },
    { title: "Thư Tình Gửi Ngoại", genre: "Gia đình, Tâm lý", duration: 118, age: "T13", status: "inactive", poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80", releaseDate: daysAgo(1), showingStatus: "now_showing" },
    // 2 phim "Sắp chiếu" mới — phục vụ demo tab "Sắp chiếu" phía khách hàng
    { title: "Đảo Giấu Vàng: Kho Báu Cuối Cùng", genre: "Phiêu lưu, Gia đình", duration: 128, age: "T13", status: "active", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80", releaseDate: daysFromNow(21), showingStatus: "coming_soon" },
    { title: "Biệt Đội Sao Băng", genre: "Hành động, Khoa học viễn tưởng", duration: 132, age: "T16", status: "active", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&q=80", releaseDate: daysFromNow(35), showingStatus: "coming_soon" },
  ];
  const movies = await Movie.insertMany(movieSeed);
  const byTitle = (title) => movies.find((m) => m.title === title);

  // ── SHOWTIMES ── (tạo bằng .create() từng cái để hook model/Showtime.js
  // chạy: tự resolve cinemaId, tự tìm/tạo đúng 1 Auditorium theo (cinema, room)
  // + sinh sơ đồ ghế thật, tự tính startTime/endTime/price)
  const today = new Date();
  const d0 = today.toISOString().slice(0, 10);
  const d1 = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);

  const showtimeSeed = [
    { movieTitle: "Nghỉ Hè Sợ Nghỉ Hưu", cinema: "Beta Thanh Xuân", room: "Phòng 1", date: d0, time: "09:45", seats: 80, sold: 62, format: "2D", status: "active" },
    { movieTitle: "Nghỉ Hè Sợ Nghỉ Hưu", cinema: "Beta Thanh Xuân", room: "Phòng 1", date: d0, time: "14:00", seats: 80, sold: 71, format: "2D", status: "active" },
    { movieTitle: "Người Nhện: Khởi Đầu Mới", cinema: "CGV Vincom Bà Triệu", room: "Phòng 3", date: d0, time: "10:30", seats: 120, sold: 98, format: "2D", status: "active" },
    { movieTitle: "Người Nhện: Khởi Đầu Mới", cinema: "CGV Vincom Bà Triệu", room: "Phòng 3", date: d0, time: "15:45", seats: 120, sold: 110, format: "3D", status: "active" },
    { movieTitle: "Hộ Linh Tráng Sĩ", cinema: "Galaxy Nguyễn Du", room: "Phòng 2", date: d0, time: "11:00", seats: 100, sold: 45, format: "IMAX", status: "active" },
    { movieTitle: "Phim Shin", cinema: "Beta Mỹ Đình", room: "Phòng 4", date: d0, time: "09:00", seats: 60, sold: 58, format: "2D", status: "active" },
    { movieTitle: "Insidious: Quỷ Quyết", cinema: "Lotte Cinema Đống Đa", room: "Phòng 5", date: d0, time: "20:30", seats: 90, sold: 30, format: "2D", status: "active" },
    { movieTitle: "Nghỉ Hè Sợ Nghỉ Hưu", cinema: "Beta Tây Sơn", room: "Phòng 2", date: d1, time: "10:00", seats: 70, sold: 0, format: "2D", status: "upcoming" },
    // Thêm vài suất buổi tối / ngày mai để trang khách hàng có nhiều khung giờ hơn để test
    { movieTitle: "Người Nhện: Khởi Đầu Mới", cinema: "CGV Vincom Bà Triệu", room: "Phòng 3", date: d1, time: "19:00", seats: 120, sold: 0, format: "2D", status: "upcoming" },
    { movieTitle: "The Odyssey", cinema: "CGV AEON Hà Đông", room: "Phòng 1", date: d0, time: "19:00", seats: 100, sold: 20, format: "IMAX", status: "active" },
  ];
  const showtimes = [];
  for (const s of showtimeSeed) {
    const movie = byTitle(s.movieTitle);
    const doc = await Showtime.create({ ...s, movie: movie._id });
    showtimes.push(doc);
  }

  // ── LẤP GHẾ ĐÃ BÁN CHO TỪNG SUẤT CHIẾU ── (dùng Booking + Seat THẬT, để
  // đúng số `sold` hiển thị bên admin khớp với số ghế "unavailable" trả về từ
  // API sơ đồ ghế thật phía khách hàng — phục vụ test yêu cầu #3/#4)
  let demoUserIndex = 0;
  for (const showtime of showtimes) {
    if (!showtime.sold || !showtime.auditoriumId) continue;

    const seatsInRoom = await Seat.find({ auditoriumId: showtime.auditoriumId })
      .sort({ row: 1, number: 1 })
      .lean();
    const seatsToOccupy = seatsInRoom.slice(0, showtime.sold);
    if (seatsToOccupy.length === 0) continue;

    // Chia số ghế "đã bán" thành các booking nhỏ (2-3 ghế/booking) cho thực tế,
    // gán xoay vòng cho các user mẫu.
    let i = 0;
    while (i < seatsToOccupy.length) {
      const chunkSize = Math.min(2 + (i % 2), seatsToOccupy.length - i); // 2 hoặc 3 ghế
      const chunk = seatsToOccupy.slice(i, i + chunkSize);
      i += chunkSize;

      const user = users[demoUserIndex % users.length];
      demoUserIndex++;

      const price = showtime.price || {};
      const seatDetails = chunk.map((seat) => ({
        seatId: seat._id,
        seatName: `${seat.row}${seat.number}`,
        seatType: seat.type,
        price: seat.type === "vip" ? (price.vip ?? price.standard ?? 95000) : (price.standard ?? 75000),
      }));
      const totalAmount = seatDetails.reduce((sum, s) => sum + s.price, 0);

      await Booking.create({
        code: await genCode(Booking, "BK"),
        user: user._id,
        userName: user.fullName,
        showtime: showtime._id,
        movie: showtime.movieTitle,
        cinema: showtime.cinema,
        date: showtime.date,
        time: showtime.time,
        seats: seatDetails.map((s) => s.seatName),
        total: Math.round(totalAmount / 1000),
        status: "confirmed",
        seatDetails,
        totalAmount,
        movieId: showtime.movie,
        cinemaId: showtime.cinemaId,
        auditoriumId: showtime.auditoriumId,
      });
    }
  }

  // ── BOOKINGS DEMO CHO ADMIN DASHBOARD ── (giữ nguyên như cũ — độc lập với
  // phần "lấp ghế" ở trên, chỉ phục vụ số liệu thống kê/danh sách admin)
  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);
  const bookingSeed = [
    { code: "BK-ADM01", userName: "Nguyễn Văn An", movie: "Nghỉ Hè Sợ Nghỉ Hưu", cinema: "Beta Thanh Xuân", date: d0, time: "14:00", seats: ["E5", "E6"], total: 100, status: "confirmed", createdAt: hoursAgo(3) },
    { code: "BK-ADM02", userName: "Trần Thị Bình", movie: "Người Nhện: Khởi Đầu Mới", cinema: "CGV Vincom Bà Triệu", date: d0, time: "15:45", seats: ["C3"], total: 50, status: "confirmed", createdAt: hoursAgo(5) },
    { code: "BK-ADM03", userName: "Lê Minh Cường", movie: "Hộ Linh Tráng Sĩ", cinema: "Galaxy Nguyễn Du", date: d0, time: "11:00", seats: ["G7", "G8", "G9"], total: 150, status: "confirmed", createdAt: hoursAgo(8) },
    { code: "BK-ADM04", userName: "Phạm Thu Dung", movie: "Phim Shin", cinema: "Beta Mỹ Đình", date: d0, time: "09:00", seats: ["A1", "A2"], total: 100, status: "cancelled", createdAt: hoursAgo(9) },
    { code: "BK-ADM05", userName: "Hoàng Văn Đức", movie: "Insidious: Quỷ Quyết", cinema: "Lotte Cinema Đống Đa", date: d0, time: "20:30", seats: ["H4"], total: 50, status: "confirmed", createdAt: hoursAgo(10) },
    { code: "BK-ADM06", userName: "Nguyễn Văn An", movie: "The Odyssey", cinema: "CGV AEON Hà Đông", date: d0, time: "19:00", seats: ["D5", "D6"], total: 100, status: "completed", createdAt: hoursAgo(30) },
    { code: "BK-ADM07", userName: "Vũ Thị Fương", movie: "Nghỉ Hè Sợ Nghỉ Hưu", cinema: "Beta Thanh Xuân", date: d0, time: "09:45", seats: ["B2", "B3"], total: 100, status: "completed", createdAt: hoursAgo(36) },
    { code: "BK-ADM08", userName: "Đặng Quốc Gia", movie: "Người Nhện: Khởi Đầu Mới", cinema: "CGV Vincom Bà Triệu", date: d1, time: "10:30", seats: ["F1", "F2", "F3"], total: 150, status: "confirmed", createdAt: hoursAgo(14) },
  ];
  const bookings = [];
  for (const b of bookingSeed) {
    const user = byName(b.userName);
    const showtime = showtimes.find((s) => s.movieTitle === b.movie && s.cinema === b.cinema);
    const doc = await Booking.create({ ...b, user: user._id, showtime: showtime?._id });
    bookings.push(doc);
  }
  const byCode = (code) => bookings.find((b) => b.code === code);

  // ── VOUCHERS ──
  const voucherSeed = [
    { code: "CGV30", discount: 30, type: "percent", description: "Giảm 30% tại CGV", minOrder: 100, usageLimit: 500, used: 234, startDate: "2026-09-01", endDate: "2026-09-30", status: "active", appliesTo: "CGV" },
    { code: "BETA50K", discount: 50, type: "fixed", description: "Giảm 50K tại Beta Cinemas", minOrder: 100, usageLimit: 300, used: 189, startDate: "2026-09-01", endDate: "2026-09-30", status: "active", appliesTo: "Beta" },
    { code: "NEWUSER", discount: 25, type: "percent", description: "Ưu đãi người dùng mới 25%", minOrder: 50, usageLimit: 1000, used: 567, startDate: "2026-01-01", endDate: "2026-12-31", status: "active", appliesTo: "Tất cả" },
    { code: "SUMMER26", discount: 30, type: "fixed", description: "Ưu đãi mùa hè giảm 30K", minOrder: 80, usageLimit: 200, used: 200, startDate: "2026-06-01", endDate: "2026-08-31", status: "expired", appliesTo: "Tất cả" },
    { code: "GALAXY20", discount: 20, type: "percent", description: "Giảm 20% tại Galaxy", minOrder: 100, usageLimit: 150, used: 43, startDate: "2026-09-01", endDate: "2026-10-31", status: "active", appliesTo: "Galaxy" },
    { code: "COMBO56", discount: 56, type: "fixed", description: "Tiết kiệm 56K khi mua combo", minOrder: 150, usageLimit: 400, used: 112, startDate: "2026-09-01", endDate: "2026-09-30", status: "active", appliesTo: "Tất cả" },
    { code: "VIP100K", discount: 100, type: "fixed", description: "Ưu đãi khách VIP 100K", minOrder: 200, usageLimit: 50, used: 12, startDate: "2026-09-07", endDate: "2026-09-14", status: "active", appliesTo: "Tất cả" },
  ];
  await Voucher.insertMany(voucherSeed);

  // ── WALLETS ── (cho 4 user có giao dịch mẫu — việc tự tạo Wallet(0đ) khi
  // đăng ký tài khoản MỚI được xử lý ở controller/Auth.js, xem giai đoạn B4)
  const walletSeed = [
    { name: "Nguyễn Văn An", balance: 250000, totalTopup: 300000, totalSpent: 100000, totalRefunded: 47500,
      transactions: [
        { id: "W001", type: "topup", amount: 200000, desc: "Nạp tiền qua VietQR", date: "2026-09-05 10:30", status: "success" },
        { id: "W002", type: "topup", amount: 100000, desc: "Nạp tiền qua VietQR", date: "2026-09-03 14:20", status: "success" },
        { id: "W003", type: "payment", amount: -50000, desc: "Thanh toán vé BK-ADM01", date: "2026-09-06 21:30", status: "success" },
        { id: "W004", type: "refund", amount: 47500, desc: "Hoàn vé BK-ADM02 (-5% phí)", date: "2026-09-04 09:15", status: "success" },
        { id: "W005", type: "payment", amount: -50000, desc: "Thanh toán vé BK-ADM04", date: "2026-09-02 18:00", status: "success" },
      ] },
    { name: "Trần Thị Bình", balance: 80000, totalTopup: 200000, totalSpent: 120000, totalRefunded: 0,
      transactions: [
        { id: "W010", type: "topup", amount: 200000, desc: "Nạp tiền qua MoMo", date: "2026-08-20 16:00", status: "success" },
        { id: "W011", type: "payment", amount: -120000, desc: "Thanh toán vé BK-ADM03", date: "2026-09-01 20:00", status: "success" },
      ] },
    { name: "Lê Minh Cường", balance: 500000, totalTopup: 500000, totalSpent: 0, totalRefunded: 0,
      transactions: [{ id: "W020", type: "topup", amount: 500000, desc: "Nạp tiền qua ZaloPay", date: "2026-09-07 08:00", status: "success" }] },
    { name: "Hoàng Văn Đức", balance: 150000, totalTopup: 1000000, totalSpent: 850000, totalRefunded: 0,
      transactions: [
        { id: "W030", type: "topup", amount: 500000, desc: "Nạp qua VietQR", date: "2026-07-01 10:00", status: "success" },
        { id: "W031", type: "topup", amount: 500000, desc: "Nạp qua VietQR", date: "2026-08-01 10:00", status: "success" },
        { id: "W032", type: "payment", amount: -850000, desc: "Thanh toán nhiều vé", date: "2026-09-01 00:00", status: "success" },
      ] },
  ];
  for (const w of walletSeed) {
    const user = byName(w.name);
    await Wallet.create({ user: user._id, userName: user.fullName, email: user.email, ...w });
  }

  // ── REFUNDS ──
  const refundSeed = [
    { code: "RF001", bookingCode: "BK-ADM01", ticketId: "TK001", movie: "Nghỉ Hè Sợ Nghỉ Hưu", cinema: "Beta Thanh Xuân", date: "07/09/2026", time: "14:00", seats: ["E5", "E6"], userName: "Nguyễn Văn An", userEmail: "an.nguyen@gmail.com", originalAmount: 100000, refundAmount: 90000, fee: 10000, feePercent: 10, requestedAt: "2026-09-06 22:15", status: "completed", processedAt: "2026-09-06 22:16" },
    { code: "RF002", bookingCode: "BK-ADM02", ticketId: "TK005", movie: "Người Nhện: Khởi Đầu Mới", cinema: "CGV Vincom Bà Triệu", date: "08/09/2026", time: "10:30", seats: ["C3", "C4"], userName: "Trần Thị Bình", userEmail: "binh.tran@gmail.com", originalAmount: 100000, refundAmount: 90000, fee: 10000, feePercent: 10, requestedAt: "2026-09-07 08:30", status: "pending", processedAt: null },
    { code: "RF003", bookingCode: "BK-ADM03", ticketId: "TK006", movie: "Hộ Linh Tráng Sĩ", cinema: "Galaxy Nguyễn Du", date: "09/09/2026", time: "15:45", seats: ["G7", "G8", "G9"], userName: "Lê Minh Cường", userEmail: "cuong.le@gmail.com", originalAmount: 150000, refundAmount: 135000, fee: 15000, feePercent: 10, requestedAt: "2026-09-07 09:00", status: "pending", processedAt: null },
    { code: "RF004", bookingCode: "BK-ADM04", ticketId: "TK007", movie: "Phim Shin", cinema: "Beta Mỹ Đình", date: "07/09/2026", time: "09:00", seats: ["A1", "A2"], userName: "Phạm Thu Dung", userEmail: "dung.pham@gmail.com", originalAmount: 100000, refundAmount: 90000, fee: 10000, feePercent: 10, requestedAt: "2026-09-06 18:45", status: "rejected", processedAt: "2026-09-06 19:00", rejectReason: "Vé đã qua giờ chiếu, không thể hoàn" },
  ];
  for (const r of refundSeed) {
    const { bookingCode, ...rest } = r;
    const booking = byCode(bookingCode);
    const user = byName(r.userName);
    await Refund.create({ ...rest, booking: booking._id, user: user._id });
  }

  // ── BANNERS ──
  const bannerSeed = [
    { image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=85", title: "Mùa Phim Hè 2026", subtitle: "Đặt vé tại hơn 50 rạp trên toàn quốc", cta: "Đặt vé ngay", badge: "HOT", active: true, order: 1 },
    { image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1400&q=85", title: "Ưu đãi Thứ 4 Vui Vẻ", subtitle: "Giảm 30% tất cả vé xem phim vào mỗi thứ 4", cta: "Xem ưu đãi", badge: "SALE", active: true, order: 2 },
    { image: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1400&q=85", title: "Combo Bắp Nước Siêu Tiết Kiệm", subtitle: "Mua vé kèm combo tiết kiệm đến 56K", cta: "Chọn combo", badge: "MỚI", active: true, order: 3 },
  ];
  await Banner.insertMany(bannerSeed);

  console.log("✅ Seed xong!");
  console.log(`Đăng nhập admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Đăng nhập khách hàng mẫu: an.nguyen@gmail.com / customer123`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed thất bại:", err);
  process.exit(1);
});
