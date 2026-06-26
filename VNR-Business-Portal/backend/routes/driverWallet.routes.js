import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getWallet,
  getBalance,
  getEarnings,
  getTodayEarnings,
  getWeekEarnings,
  getMonthEarnings,
  requestWithdrawal,
  getWithdrawals,
  releaseEarnings,
} from '../controllers/driverWallet.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(protect);

// Wallet del conductor
router.get('/', getWallet);
router.get('/balance', getBalance);

// Ganancias
router.get('/earnings', getEarnings);
router.get('/earnings/today', getTodayEarnings);
router.get('/earnings/week', getWeekEarnings);
router.get('/earnings/month', getMonthEarnings);

// Retiros
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);

// Admin: Liberar ganancias pendientes (para cron job)
router.post('/release-earnings', authorize('admin'), releaseEarnings);

export default router;
