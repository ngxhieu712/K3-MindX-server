// Bọc controller async để không phải try/catch lặp lại ở mọi nơi.
// Lỗi ném ra (throw) trong handler sẽ tự động chuyển vào next(err).
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;
