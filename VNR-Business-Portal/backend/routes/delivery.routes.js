import express from "express";
import {
  createDelivery,
  getUserDeliveries,
  getDeliveryById,
  trackDelivery,
  cancelDelivery,
  // Cadete endpoints
  getAvailableDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  getCadeteDeliveries,
  cadeteCancelDelivery,
  // Simulación
  simulateDriverLocation,
} from "../controllers/delivery.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Ruta pública para rastreo
router.get("/track/:trackingNumber", trackDelivery);

// Ruta de simulación (solo desarrollo - sin autenticación)
router.post("/simulate/location", simulateDriverLocation);

// Rutas privadas
router.use(protect);

// Rutas de usuario
router.post("/", createDelivery);
router.get("/", getUserDeliveries);

// Rutas de cadete (DEBEN ir antes de /:id)
router.get("/cadete/available", getAvailableDeliveries);
router.get("/cadete/deliveries", getCadeteDeliveries);

// Rutas con parámetro :id
router.get("/:id", getDeliveryById);
router.put("/:id/cancel", cancelDelivery);
router.put("/:id/accept", acceptDelivery);
router.put("/:id/status", updateDeliveryStatus);
router.put("/:id/cadete-cancel", cadeteCancelDelivery);

export default router;

