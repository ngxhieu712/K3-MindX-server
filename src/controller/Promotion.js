import { Voucher } from "../model/Voucher.js";

// GET /api/vouchers?search=&status=&page=&limit=
export const listVouchers = async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 100 } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const [data, total] = await Promise.all([
    Voucher.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Voucher.countDocuments(filter),
  ]);

  return res.status(200).json({ data, total, page: pageNum, limit: limitNum });
};

// POST /api/vouchers
export const createVoucher = async (req, res) => {
  const { code, discount, type, description, minOrder, usageLimit, startDate, endDate, appliesTo, status } = req.body;
  if (!code || discount == null) return res.status(400).json({ message: "Thiếu mã voucher hoặc mức giảm" });

  const existed = await Voucher.findOne({ code: code.toUpperCase() });
  if (existed) return res.status(409).json({ message: "Mã voucher đã tồn tại" });

  const voucher = await Voucher.create({ code, discount, type, description, minOrder, usageLimit, startDate, endDate, appliesTo, status });
  return res.status(201).json({ message: "Đã tạo voucher", data: voucher });
};

// PUT /api/vouchers/:id
export const updateVoucher = async (req, res) => {
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!voucher) return res.status(404).json({ message: "Không tìm thấy voucher" });
  return res.status(200).json({ message: "Đã cập nhật voucher", data: voucher });
};

// DELETE /api/vouchers/:id
export const deleteVoucher = async (req, res) => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);
  if (!voucher) return res.status(404).json({ message: "Không tìm thấy voucher" });
  return res.status(200).json({ message: "Đã xóa voucher" });
};
