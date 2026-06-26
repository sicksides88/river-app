import express from 'express';
import { protect, driverOnly } from '../middleware/auth.middleware.js';
import {
  getConnectUrl,
  handleCallback,
  exchangeCode,
  disconnectAccount,
  getStatus,
  refreshToken,
} from '../controllers/mercadopagoOAuth.controller.js';

const router = express.Router();

// =====================================================
// RUTAS PÚBLICAS (callback de MP)
// =====================================================

// GET /api/driver/mercadopago/callback - Callback OAuth de MercadoPago
router.get('/callback', handleCallback);

// =====================================================
// RUTAS PRIVADAS (requieren autenticación de driver)
// =====================================================

// GET /api/driver/mercadopago/connect - Obtener URL de autorización
router.get('/connect', protect, driverOnly, getConnectUrl);

// POST /api/driver/mercadopago/exchange - Intercambiar código por tokens
router.post('/exchange', protect, driverOnly, exchangeCode);

// POST /api/driver/mercadopago/disconnect - Desconectar cuenta MP
router.post('/disconnect', protect, driverOnly, disconnectAccount);

// GET /api/driver/mercadopago/status - Estado de conexión
router.get('/status', protect, driverOnly, getStatus);

// POST /api/driver/mercadopago/refresh - Refrescar token (manual)
router.post('/refresh', protect, driverOnly, refreshToken);

export default router;
