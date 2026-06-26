import express from "express";
import {
  getSchedule,
  updateSchedule,
  addCustomDate,
  removeCustomDate,
} from "../controllers/schedule.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Obtener horario del conductor
router.get("/", protect, getSchedule);

// Actualizar horario completo
router.put("/", protect, updateSchedule);

// Agregar fecha específica
router.post("/custom-date", protect, addCustomDate);

// Eliminar fecha específica
router.delete("/custom-date/:dateId", protect, removeCustomDate);

export default router;
