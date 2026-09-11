import { Cinema } from "../model/Cinema.js";

// GET /api/cinemas?chain=
export const listCinemas = async (req, res) => {
  const { chain } = req.query;
  const filter = {};
  if (chain) filter.chain = chain;
  const data = await Cinema.find(filter).sort({ chain: 1, name: 1 });
  return res.status(200).json({ data, total: data.length });
};

// POST /api/cinemas
export const createCinema = async (req, res) => {
  const { name, chain, color, address } = req.body;
  if (!name || !chain) return res.status(400).json({ message: "Thiếu tên rạp hoặc hãng" });
  const cinema = await Cinema.create({ name, chain, color, address });
  return res.status(201).json({ message: "Đã thêm rạp", data: cinema });
};

// PUT /api/cinemas/:id
export const updateCinema = async (req, res) => {
  const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
  return res.status(200).json({ message: "Đã cập nhật rạp", data: cinema });
};

// DELETE /api/cinemas/:id
export const deleteCinema = async (req, res) => {
  const cinema = await Cinema.findByIdAndDelete(req.params.id);
  if (!cinema) return res.status(404).json({ message: "Không tìm thấy rạp" });
  return res.status(200).json({ message: "Đã xóa rạp" });
};
