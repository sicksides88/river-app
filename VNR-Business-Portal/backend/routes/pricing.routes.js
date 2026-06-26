import express from "express";
import { estimatePrice, getEnabledServices } from "../services/pricing.service.js";

const router = express.Router();

// @desc    Servicios habilitados por la plataforma (CRM: service_rates.is_active)
// @route   GET /api/pricing/services
// @access  Public (solo expone qué servicios están activos, sin datos sensibles)
router.get("/services", async (req, res) => {
  try {
    const rates = await getEnabledServices();
    res.json({
      success: true,
      services: rates.map((r) => r.service_type), // ['envios','vuelta_segura',...]
      rates,
    });
  } catch (error) {
    console.error("Error obteniendo servicios habilitados:", error);
    res.status(500).json({ success: false, message: "Error obteniendo servicios" });
  }
});

// @desc    Estimar precio de un servicio según las tarifas del CRM (service_rates)
// @route   GET /api/pricing/estimate?serviceType=envio&distance=15.8&hours=0
// @access  Public (solo expone tarifas, sin datos sensibles)
router.get("/estimate", async (req, res) => {
  try {
    const { serviceType, distance, hours } = req.query;
    if (!serviceType) {
      return res.status(400).json({ success: false, message: "serviceType requerido" });
    }
    const result = await estimatePrice({
      serviceType,
      distanceKm: parseFloat(distance) || 0,
      hours: parseFloat(hours) || 0,
    });
    res.json({
      success: true,
      price: result.price,
      serviceType: result.rate.service_type,
      baseRate: result.rate.base_rate,
      perUnitRate: result.rate.per_unit_rate,
      unitType: result.rate.unit_type,
      minimumPrice: result.rate.minimum_price,
      units: result.units,
    });
  } catch (error) {
    console.error("Error estimando precio:", error);
    res.status(500).json({ success: false, message: "Error estimando precio" });
  }
});

export default router;
