import { Refund } from "../model/Refund.js";
import { Wallet } from "../model/Wallet.js";

// GET /api/refunds?search=&status=&page=&limit=
export const listRefunds = async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 100 } = req.query;

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
    Refund.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Refund.countDocuments(filter),
  ]);

  return res.status(200).json({ data, total, page: pageNum, limit: limitNum });
};

// PATCH /api/refunds/:id/approve
// Duyệt hoàn tiền: đánh dấu completed + cộng tiền vào ví người dùng (nếu đã có ví).
export const approveRefund = async (req, res) => {
  const refund = await Refund.findById(req.params.id);
  if (!refund) return res.status(404).json({ message: "Không tìm thấy yêu cầu hoàn vé" });
  if (refund.status !== "pending") return res.status(400).json({ message: "Yêu cầu này đã được xử lý" });

  refund.status = "completed";
  refund.processedAt = new Date().toISOString();
  await refund.save();

  const wallet = await Wallet.findOne({ user: refund.user });
  if (wallet) {
    wallet.balance += refund.refundAmount;
    wallet.totalRefunded += refund.refundAmount;
    wallet.transactions.unshift({
      id: "W" + Date.now(),
      type: "refund",
      amount: refund.refundAmount,
      desc: `Hoàn vé ${refund.code} (-${refund.feePercent}% phí)`,
      date: new Date().toLocaleString("vi-VN"),
      status: "success",
    });
    await wallet.save();
  }

  return res.status(200).json({ message: "Đã duyệt hoàn tiền", data: refund });
};

// PATCH /api/refunds/:id/reject  body: { reason }
export const rejectRefund = async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ message: "Thiếu lý do từ chối" });

  const refund = await Refund.findById(req.params.id);
  if (!refund) return res.status(404).json({ message: "Không tìm thấy yêu cầu hoàn vé" });
  if (refund.status !== "pending") return res.status(400).json({ message: "Yêu cầu này đã được xử lý" });

  refund.status = "rejected";
  refund.processedAt = new Date().toISOString();
  refund.rejectReason = reason;
  await refund.save();

  return res.status(200).json({ message: "Đã từ chối yêu cầu hoàn vé", data: refund });
};
