import { Router } from "express";
import { requireAdmin } from "../middleware/Auth.js";
import { listMovies, getMovie, createMovie, updateMovie, deleteMovie } from "../controller/Movie.js";

const router = Router();

router.get("/", requireAdmin, listMovies);
router.get("/:id", requireAdmin, getMovie);
router.post("/", requireAdmin, createMovie);
router.put("/:id", requireAdmin, updateMovie);
router.delete("/:id", requireAdmin, deleteMovie);

export default router;
