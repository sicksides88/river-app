import express from "express";
import {
  getRecentLocations,
  getFrequentLocations,
  saveLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/location.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.get("/recent", getRecentLocations);
router.get("/frequent", getFrequentLocations);
router.post("/", saveLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

export default router;

