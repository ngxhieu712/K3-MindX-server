import { Showtime } from "../model/Showtime.js";
import { Movie } from "../model/Movie.js";

// GET /api/showtimes?search=&cinema=&date=&status=&page=&limit=
export const listShowtimes = async (req, res) => {
  const { search = "", cinema, date, status = "all", page = 1, limit = 100 } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;
  if (cinema) filter.cinema = cinema;
  if (date) filter.date = date;
  if (search) filter.movieTitle = { $regex: search, $options: "i" };

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const [data, total] = await Promise.all([
    Showtime.find(filter).sort({ date: 1, time: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Showtime.countDocuments(filter),
  ]);

  return res.status(200).json({ data, total, page: pageNum, limit: limitNum });
};

// POST /api/showtimes
export const createShowtime = async (req, res) => {
  const { movieId, cinema, room, date, time, seats, format, status } = req.body;
  if (!movieId || !cinema || !date || !time) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc (phim, rạp, ngày, giờ)" });
  }
  const movie = await Movie.findById(movieId);
  if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

  const showtime = await Showtime.create({
    movie: movie._id,
    movieTitle: movie.title,
    cinema, room, date, time,
    seats: Number(seats) || 80,
    format, status,
  });
  return res.status(201).json({ message: "Đã tạo suất chiếu", data: showtime });
};

// PUT /api/showtimes/:id
export const updateShowtime = async (req, res) => {
  const body = { ...req.body };
  if (body.movieId) {
    const movie = await Movie.findById(body.movieId);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    body.movie = movie._id;
    body.movieTitle = movie.title;
    delete body.movieId;
  }
  const showtime = await Showtime.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
  return res.status(200).json({ message: "Đã cập nhật suất chiếu", data: showtime });
};

// DELETE /api/showtimes/:id
export const deleteShowtime = async (req, res) => {
  const showtime = await Showtime.findByIdAndDelete(req.params.id);
  if (!showtime) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
  return res.status(200).json({ message: "Đã xóa suất chiếu" });
};
