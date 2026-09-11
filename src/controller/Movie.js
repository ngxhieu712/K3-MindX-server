import { Movie } from "../model/Movie.js";

// GET /api/movies?search=&status=&page=&limit=
export const listMovies = async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 100 } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);

  const [data, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Movie.countDocuments(filter),
  ]);

  return res.status(200).json({ data, total, page: pageNum, limit: limitNum });
};

// GET /api/movies/:id
export const getMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
  return res.status(200).json({ data: movie });
};

// POST /api/movies
export const createMovie = async (req, res) => {
  const { title, genre, duration, age, status, poster } = req.body;
  if (!title) return res.status(400).json({ message: "Thiếu tên phim" });

  const movie = await Movie.create({ title, genre, duration, age, status, poster });
  return res.status(201).json({ message: "Đã thêm phim", data: movie });
};

// PUT /api/movies/:id
export const updateMovie = async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
  return res.status(200).json({ message: "Đã cập nhật phim", data: movie });
};

// DELETE /api/movies/:id
export const deleteMovie = async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
  return res.status(200).json({ message: "Đã xóa phim" });
};
