import { Booking } from "../model/Booking.js";

// GET /api/bookings?search=&status=&page=&limit=&sort=
export const listBookings = async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 100, sort = "-createdAt" } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } },
      { movie: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const [data, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  const totalRevenue = await Booking.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: null, sum: { $sum: "$total" } } },
  ]);

  return res.status(200).json({
    data, total, page: pageNum, limit: limitNum,
    totalRevenue: totalRevenue[0]?.sum || 0,
  });
};

// GET /api/bookings/:id
export const getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
  return res.status(200).json({ data: booking });
};

// PATCH /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
  if (booking.status === "cancelled") {
    return res.status(400).json({ message: "Đơn đã bị hủy trước đó" });
  }
  booking.status = "cancelled";
  await booking.save();
  return res.status(200).json({ message: "Đã hủy đơn đặt vé", data: booking });
};
