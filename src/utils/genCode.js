// Sinh mã hiển thị dạng "BK001", "RF002"... dựa trên số lượng document hiện có.
// Đơn giản, đủ dùng cho quy mô admin panel này (không phải hệ thống concurrency cao).
export async function genCode(Model, prefix, padLength = 3) {
  const count = await Model.countDocuments();
  return `${prefix}${String(count + 1).padStart(padLength, "0")}`;
}
