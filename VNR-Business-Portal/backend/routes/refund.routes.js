import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  paymentRateLimit,
  auditPayment,
} from '../middleware/payment.security.js';
import {
  requestRefund,
  getMyRefunds,
  getRefundById,
  cancelRefund,
  calculateRefund,
  getRefundPolicies,
  getPendingRefunds,
  approveRefund,
  rejectRefund,
  getRefundStats,
} from '../controllers/refund.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(protect);

// =====================================================
// RUTAS DE USUARIO
// =====================================================

// Obtener políticas de reembolso
router.get('/policies', paymentRateLimit({ max: 30 }), getRefundPolicies);

// Calcular monto de reembolso (preview)
router.post('/calculate', paymentRateLimit({ max: 20 }), calculateRefund);

// Solicitar reembolso
router.post(
  '/',
  paymentRateLimit({ max: 5, keyPrefix: 'refund_request' }),
  auditPayment('refund_request'),
  requestRefund
);

// Obtener mis reembolsos
router.get('/', paymentRateLimit({ max: 30 }), getMyRefunds);

// Obtener detalle de reembolso
router.get('/:id', paymentRateLimit({ max: 30 }), getRefundById);

// Cancelar solicitud de reembolso
router.put(
  '/:id/cancel',
  paymentRateLimit({ max: 10 }),
  auditPayment('refund_cancel'),
  cancelRefund
);

// =====================================================
// RUTAS DE ADMIN
// =====================================================

// Obtener reembolsos pendientes
router.get('/admin/pending', authorize('admin'), paymentRateLimit({ max: 60 }), getPendingRefunds);

// Obtener estadísticas
router.get('/admin/stats', authorize('admin'), paymentRateLimit({ max: 30 }), getRefundStats);

// Aprobar reembolso
router.put(
  '/:id/approve',
  authorize('admin'),
  paymentRateLimit({ max: 30 }),
  auditPayment('refund_approve'),
  approveRefund
);

// Rechazar reembolso
router.put(
  '/:id/reject',
  authorize('admin'),
  paymentRateLimit({ max: 30 }),
  auditPayment('refund_reject'),
  rejectRefund
);

export default router;
