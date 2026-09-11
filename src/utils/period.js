// Helper tính khoảng thời gian cho period "today" | "month" | "year"
// và các nhãn trục X cho biểu đồ dashboard.

const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]; // getDay(): 0=CN

export function getPeriodRange(period) {
  const now = new Date();
  let start;
  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    // "month" (mặc định)
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start, end: now };
}

// Trả về mảng { key, label } theo trục thời gian phù hợp với từng period,
// dùng để dựng chart luôn có đủ mốc dù ngày đó không có dữ liệu (giá trị 0).
export function getChartBuckets(period) {
  const now = new Date();

  if (period === "today") {
    // 7 khung 2 giờ: 8h,10h,...,20h
    return [8, 10, 12, 14, 16, 18, 20].map((h) => ({ key: String(h), label: `${h}h` }));
  }

  if (period === "year") {
    // 6 tháng gần nhất (tính cả tháng hiện tại)
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `T${d.getMonth() + 1}` });
    }
    return buckets;
  }

  // "month": 7 ngày gần nhất
  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({ key: d.toISOString().slice(0, 10), label: WEEKDAY_LABELS_VI[d.getDay()] });
  }
  return buckets;
}

export function bucketKeyForDate(period, date) {
  const d = new Date(date);
  if (period === "today") {
    let h = d.getHours() - (d.getHours() % 2);
    if (h < 8) h = 8;
    if (h > 20) h = 20;
    return String(h);
  }
  if (period === "year") {
    return `${d.getFullYear()}-${d.getMonth()}`;
  }
  return d.toISOString().slice(0, 10);
}
