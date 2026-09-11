import { Booking } from "../model/Booking.js";
import { User } from "../model/User.js";
import { Movie } from "../model/Movie.js";
import { Showtime } from "../model/Showtime.js";
import { Cinema } from "../model/Cinema.js";
import { getPeriodRange, getChartBuckets, bucketKeyForDate } from "../utils/period.js";

const VALID_PERIODS = ["today", "month", "year"];
const normalizePeriod = (p) => (VALID_PERIODS.includes(p) ? p : "month");

// GET /api/stats/overview?period=today|month|year
export const getOverview = async (req, res) => {
  const period = normalizePeriod(req.query.period);
  const { start, end } = getPeriodRange(period);

  const bookingsInPeriod = await Booking.find({
    status: { $ne: "cancelled" },
    createdAt: { $gte: start, $lte: end },
  }).select("total seats createdAt");

  const revenue = bookingsInPeriod.reduce((s, b) => s + b.total, 0);
  const tickets = bookingsInPeriod.reduce((s, b) => s + (b.seats?.length || 0), 0);

  // Chart theo bucket phù hợp period
  const buckets = getChartBuckets(period);
  const bucketMap = new Map(buckets.map((b) => [b.key, 0]));
  for (const b of bookingsInPeriod) {
    const key = bucketKeyForDate(period, b.createdAt);
    if (bucketMap.has(key)) bucketMap.set(key, bucketMap.get(key) + b.total);
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalUsers, newUsersToday, totalMovies, activeShowtimes] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: startOfToday } }),
    Movie.countDocuments({ status: "active" }),
    Showtime.countDocuments({ status: "active" }),
  ]);

  return res.status(200).json({
    period,
    revenue,
    tickets,
    chart: buckets.map((b) => bucketMap.get(b.key)),
    chartLabels: buckets.map((b) => b.label),
    totalUsers,
    newUsersToday,
    totalMovies,
    activeShowtimes,
  });
};

// GET /api/stats/revenue-by-chain?period=today|month|year
// Trả về doanh thu/vé theo hãng rạp, kèm chi tiết từng rạp trong hãng (để FE hiển thị modal drill-down).
export const getRevenueByChain = async (req, res) => {
  const period = normalizePeriod(req.query.period);
  const { start, end } = getPeriodRange(period);

  const [rows, cinemas] = await Promise.all([
    Booking.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { cinema: "$cinema", movie: "$movie" },
          revenue: { $sum: "$total" },
          tickets: { $sum: { $size: "$seats" } },
        },
      },
    ]),
    Cinema.find(),
  ]);

  const cinemaInfo = new Map(cinemas.map((c) => [c.name, { chain: c.chain, color: c.color }]));

  // cinema -> { revenue, tickets, movies: Map(movie -> revenue) }
  const byCinema = new Map();
  for (const row of rows) {
    const { cinema, movie } = row._id;
    if (!byCinema.has(cinema)) byCinema.set(cinema, { revenue: 0, tickets: 0, movies: new Map() });
    const entry = byCinema.get(cinema);
    entry.revenue += row.revenue;
    entry.tickets += row.tickets;
    entry.movies.set(movie, (entry.movies.get(movie) || 0) + row.revenue);
  }

  // chain -> { name, color, revenue, tickets, cinemas: [] }
  const byChain = new Map();
  for (const [cinemaName, entry] of byCinema.entries()) {
    const info = cinemaInfo.get(cinemaName) || { chain: "Khác", color: "#888888" };
    if (!byChain.has(info.chain)) {
      byChain.set(info.chain, { name: info.chain, color: info.color, revenue: 0, tickets: 0, cinemas: [] });
    }
    const chain = byChain.get(info.chain);
    chain.revenue += entry.revenue;
    chain.tickets += entry.tickets;

    let topMovie = "";
    let topRevenue = -1;
    for (const [movie, rev] of entry.movies.entries()) {
      if (rev > topRevenue) { topRevenue = rev; topMovie = movie; }
    }

    chain.cinemas.push({ name: cinemaName, color: info.color, revenue: entry.revenue, tickets: entry.tickets, topMovie });
  }

  const data = Array.from(byChain.values()).sort((a, b) => b.revenue - a.revenue);
  return res.status(200).json({ period, data });
};

// GET /api/stats/top-movies?period=today|month|year&limit=5
export const getTopMovies = async (req, res) => {
  const period = normalizePeriod(req.query.period);
  const limit = Math.max(1, Number(req.query.limit) || 5);
  const { start, end } = getPeriodRange(period);

  const data = await Booking.aggregate([
    { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$movie", revenue: { $sum: "$total" }, tickets: { $sum: { $size: "$seats" } } } },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $project: { _id: 0, title: "$_id", revenue: 1, tickets: 1 } },
  ]);

  return res.status(200).json({ period, data });
};
