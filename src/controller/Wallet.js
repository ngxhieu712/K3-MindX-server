import { Wallet } from "../model/Wallet.js";

// GET /api/wallets?search=&page=&limit=
export const listWallets = async (req, res) => {
  const { search = "", page = 1, limit = 100 } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { userName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const [data, total, totals] = await Promise.all([
    Wallet.find(filter).sort({ balance: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Wallet.countDocuments(filter),
    Wallet.aggregate([{ $group: { _id: null, totalBalance: { $sum: "$balance" }, totalTopup: { $sum: "$totalTopup" } } }]),
  ]);

  return res.status(200).json({
    data, total, page: pageNum, limit: limitNum,
    totalBalance: totals[0]?.totalBalance || 0,
    totalTopup: totals[0]?.totalTopup || 0,
  });
};

// GET /api/wallets/:userId
export const getWalletByUser = async (req, res) => {
  const wallet = await Wallet.findOne({ user: req.params.userId });
  if (!wallet) return res.status(404).json({ message: "Người dùng chưa có ví" });
  return res.status(200).json({ data: wallet });
};

// PATCH /api/wallets/:userId/adjust  body: { amount, note }
// amount dương = cộng tiền, âm = trừ tiền (do admin thao tác thủ công)
export const adjustWallet = async (req, res) => {
  const { amount, note } = req.body;
  const amt = Number(amount);
  if (!amt) return res.status(400).json({ message: "Số tiền không hợp lệ" });

  const wallet = await Wallet.findOne({ user: req.params.userId });
  if (!wallet) return res.status(404).json({ message: "Người dùng chưa có ví" });

  wallet.balance += amt;
  if (amt > 0) wallet.totalTopup += amt;
  else wallet.totalSpent += Math.abs(amt);

  wallet.transactions.unshift({
    id: "WA" + Date.now(),
    type: amt > 0 ? "topup" : "payment",
    amount: amt,
    desc: note || "Điều chỉnh bởi Admin",
    date: new Date().toLocaleString("vi-VN"),
    status: "success",
  });
  await wallet.save();

  return res.status(200).json({ message: "Đã điều chỉnh số dư", data: wallet });
};
