import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  calculateSplit,
  getSplitByPayment,
  getDriverSplits,
  getCommissionRate,
  getAllCommissions,
  updateCommission,
  sendTip,
  getDriverTips,
  getPlatformSummary,
} from '../controllers/paymentSplit.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(protect);

// =====================================================
// DIVISION DE PAGOS
// =====================================================

// Calcular division de pago (preview)
router.post('/calculate', calculateSplit);

// Obtener division por ID de pago
router.get('/payment/:paymentId', getSplitByPayment);

// Obtener divisiones del conductor actual
router.get('/driver', getDriverSplits);

// =====================================================
// CONFIGURACION DE COMISIONES
// =====================================================

// Obtener todas las configuraciones de comision
router.get('/commissions', getAllCommissions);

// Obtener tasa de comision por tipo de servicio
router.get('/commission/:serviceType', getCommissionRate);

// Actualizar configuracion de comision (Admin)
router.put('/commission/:serviceType', authorize('admin'), updateCommission);

// =====================================================
// PROPINAS
// =====================================================

// Enviar propina
router.post('/tip', sendTip);

// Obtener propinas recibidas (conductor)
router.get('/tips', getDriverTips);

// =====================================================
// REPORTES (Admin)
// =====================================================

// Obtener resumen de ganancias de plataforma
router.get('/platform-summary', authorize('admin'), getPlatformSummary);

export default router;
