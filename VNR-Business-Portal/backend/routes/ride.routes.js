import express from "express";
import {
  createRide,
  getUserRides,
  getRideById,
  cancelRide,
  // Driver endpoints
  getAvailableRides,
  acceptRide,
  rejectRide,
  updateRideStatus,
  getDriverRides,
  driverCancelRide,
  // Queue endpoints
  getQueueStatus,
} from "../controllers/ride.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de usuario
router.post("/", createRide);
router.get("/", getUserRides);

// Rutas de conductor (DEBEN ir antes de /:id)
router.get("/driver/available", getAvailableRides);
router.get("/driver/rides", getDriverRides);

// Rutas con parámetro :id
router.get("/:id", getRideById);
router.get("/:id/queue-status", getQueueStatus);
router.put("/:id/cancel", cancelRide);
router.put("/:id/accept", acceptRide);
router.put("/:id/reject", rejectRide);
router.put("/:id/status", updateRideStatus);
router.put("/:id/driver-cancel", driverCancelRide);

export default router;

