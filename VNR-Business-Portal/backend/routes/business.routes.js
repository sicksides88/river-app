import express from "express";
import { protect, businessOnly } from "../middleware/auth.middleware.js";
import {
  registerBusiness,
  loginBusiness,
  getBusinessProfile,
  updateBusinessProfile,
  estimateDeliveryPrice,
  createBusinessDelivery,
  getBusinessDeliveries,
  getBusinessDeliveryById,
  cancelBusinessDelivery,
  repeatBusinessDelivery,
  getBusinessCharges,
} from "../controllers/business.controller.js";

const router = express.Router();

// Rutas públicas
router.post("/register", registerBusiness);
router.post("/login", loginBusiness);

// Rutas protegidas (requiere auth + role business)
router.use(protect);
router.use(businessOnly);

// Perfil
router.get("/profile", getBusinessProfile);
router.put("/profile", updateBusinessProfile);

// Estimación de precio
router.post("/estimate-price", estimateDeliveryPrice);

// Deliveries
router.post("/deliveries", createBusinessDelivery);
router.get("/deliveries", getBusinessDeliveries);
router.get("/deliveries/:id", getBusinessDeliveryById);
router.put("/deliveries/:id/cancel", cancelBusinessDelivery);
router.post("/deliveries/:id/repeat", repeatBusinessDelivery);

// Cargos/Facturación
router.get("/charges", getBusinessCharges);

export default router;
