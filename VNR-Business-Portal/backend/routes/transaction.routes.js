import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getTransactions,
  getTransaction,
  getTransactionsSummary,
  getTransactionStats,
  exportTransactions,
  getTransactionsByRange,
} from '../controllers/transaction.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(protect);

// Rutas de historial de transacciones
router.get('/', getTransactions);
router.get('/summary', getTransactionsSummary);
router.get('/stats', getTransactionStats);
router.get('/export', exportTransactions);
router.get('/range', getTransactionsByRange);
router.get('/:id', getTransaction);

export default router;
