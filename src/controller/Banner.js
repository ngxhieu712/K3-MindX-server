import { Banner } from "../model/Banner.js";

// GET /api/banners
export const listBanners = async (req, res) => {
  const data = await Banner.find().sort({ order: 1 });
  return res.status(200).json({ data, total: data.length });
};

// POST /api/banners
export const createBanner = async (req, res) => {
  const { image, title, subtitle, cta, badge, active, order } = req.body;
  if (!image || !title) return res.status(400).json({ message: "Thiếu hình ảnh hoặc tiêu đề" });
  const banner = await Banner.create({ image, title, subtitle, cta, badge, active, order });
  return res.status(201).json({ message: "Đã thêm banner", data: banner });
};

// PUT /api/banners/:id
export const updateBanner = async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });
  return res.status(200).json({ message: "Đã cập nhật banner", data: banner });
};

// PATCH /api/banners/:id/toggle-active
export const toggleBannerActive = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });
  banner.active = !banner.active;
  await banner.save();
  return res.status(200).json({ message: "Đã cập nhật trạng thái hiển thị", data: banner });
};

// PATCH /api/banners/:id/reorder  body: { direction: "up" | "down" }
export const reorderBanner = async (req, res) => {
  const { direction } = req.body;
  const all = await Banner.find().sort({ order: 1 });
  const idx = all.findIndex((b) => String(b._id) === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy banner" });

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) {
    return res.status(400).json({ message: "Đã ở vị trí đầu/cuối" });
  }

  const a = all[idx], b = all[swapIdx];
  const tmp = a.order;
  a.order = b.order;
  b.order = tmp;
  await Promise.all([a.save(), b.save()]);

  const data = await Banner.find().sort({ order: 1 });
  return res.status(200).json({ message: "Đã sắp xếp lại thứ tự", data });
};

// DELETE /api/banners/:id
export const deleteBanner = async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });
  return res.status(200).json({ message: "Đã xóa banner" });
};
