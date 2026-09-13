import { Router } from "express";
import { listMovies } from "../controller/movie.controller.js";

const router = Router();

router.get("/", listMovies); // GET /api/customer/movies

export default router;
