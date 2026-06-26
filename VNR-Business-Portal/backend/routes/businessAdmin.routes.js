import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessDeliveries,
  assignDriver,
  getAvailableDrivers,
  getBusinessCharges,
  invoiceCharge,
  payCharge,
} from "../controllers/businessAdmin.controller.js";

const router = express.Router();

// Todas las rutas requieren auth + role admin
router.use(protect);
router.use(authorize('admin'));

// Comercios
router.get("/businesses", getBusinesses);
router.get("/businesses/:id", getBusinessById);
router.put("/businesses/:id", updateBusiness);
router.delete("/businesses/:id", deleteBusiness);

// Pedidos de comercios
router.get("/business-deliveries", getBusinessDeliveries);
router.put("/business-deliveries/:id/assign", assignDriver);

// Cargos/Facturación
router.get("/business-charges", getBusinessCharges);
router.put("/business-charges/:id/invoice", invoiceCharge);
router.put("/business-charges/:id/pay", payCharge);

// Cadetes disponibles
router.get("/available-drivers", getAvailableDrivers);

export default router;
