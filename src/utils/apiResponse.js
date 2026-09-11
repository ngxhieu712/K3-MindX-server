// Quy ước response đã thống nhất:
// - Thành công: { success: true, data }
// - Lỗi:        { success: false, message }

export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};
