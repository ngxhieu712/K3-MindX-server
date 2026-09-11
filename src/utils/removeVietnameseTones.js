// Nội dung chuyển khoản ngân hàng thường yêu cầu không dấu để tránh lỗi hiển thị/từ chối
// bởi hệ thống ngân hàng. Hàm này chuyển "Thanh toán đơn hàng" -> "Thanh toan don hang".
export const removeVietnameseTones = (str = "") => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
};

export default removeVietnameseTones;
