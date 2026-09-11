import { Router } from "express";
import { listMovies } from "../controllers/movie.controller.js";

const router = Router();

router.get("/", listMovies); // GET /api/movies

export default router;
