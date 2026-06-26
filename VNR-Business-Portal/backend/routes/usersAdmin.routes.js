import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/usersAdmin.controller.js";

const router = express.Router();

// Todas las rutas requieren auth + role admin
router.use(protect);
router.use(authorize('admin'));

router.get("/users/stats", getUserStats);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
