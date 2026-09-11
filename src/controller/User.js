import { User } from "../model/User.js";
import { Booking } from "../model/Booking.js";

// GET /api/users?search=&status=&page=&limit=
// Chỉ trả về role=customer (nhân viên/admin không hiển thị ở bảng khách hàng này).
export const listUsers = async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 100 } = req.query;

  const filter = { role: "customer" };
  if (status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const [users, total] = await Promise.all([
    User.find(filter).select("-hashPassword").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(filter),
  ]);

  // Gộp số vé đã đặt + tổng chi tiêu từ Booking (không tính đơn đã hủy)
  const userIds = users.map((u) => u._id);
  const stats = await Booking.aggregate([
    { $match: { user: { $in: userIds }, status: { $ne: "cancelled" } } },
    { $group: { _id: "$user", totalBookings: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
  ]);
  const statsMap = new Map(stats.map((s) => [String(s._id), s]));

  const data = users.map((u) => {
    const s = statsMap.get(String(u._id));
    return {
      id: u._id,
      name: u.fullName,
      email: u.email,
      phone: u.phoneNumber,
      joinDate: u.createdAt,
      status: u.status,
      totalBookings: s?.totalBookings || 0,
      totalSpent: s?.totalSpent || 0,
    };
  });

  return res.status(200).json({ data, total, page: pageNum, limit: limitNum });
};

// PATCH /api/users/:id/toggle-status
export const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
  user.status = user.status === "active" ? "locked" : "active";
  await user.save();
  return res.status(200).json({ message: "Đã cập nhật trạng thái người dùng", data: { id: user._id, status: user.status } });
};
