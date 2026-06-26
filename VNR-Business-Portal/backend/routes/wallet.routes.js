import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  paymentRateLimit,
  validatePaymentAmount,
  auditPayment,
} from '../middleware/payment.security.js';
import {
  getWallet,
  getBalance,
  initiateDeposit,
  confirmDeposit,
  requestWithdrawal,
  getTransactions,
  getTransaction,
  getBankAccounts,
  addBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
  getSavedPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../controllers/wallet.controller.js';

const router = express.Router();

// Callback de confirmación de depósito (webhook)
router.post('/deposit/confirm', auditPayment('deposit_confirm'), confirmDeposit);

// Rutas protegidas
router.use(protect);

// =====================================================
// WALLET
// =====================================================
router.get('/', paymentRateLimit({ max: 60 }), getWallet);
router.get('/balance', paymentRateLimit({ max: 60 }), getBalance);

// =====================================================
// DEPÓSITOS
// =====================================================
router.post(
  '/deposit',
  paymentRateLimit({ max: 10, keyPrefix: 'deposit' }),
  validatePaymentAmount({ minAmount: 100, maxAmount: 50000, field: 'amount' }),
  auditPayment('deposit_initiate'),
  initiateDeposit
);

// =====================================================
// RETIROS
// =====================================================
router.post(
  '/withdraw',
  paymentRateLimit({ max: 5, keyPrefix: 'withdraw' }),
  validatePaymentAmount({ minAmount: 500, maxAmount: 100000, field: 'amount' }),
  auditPayment('withdrawal_request'),
  requestWithdrawal
);

// =====================================================
// TRANSACCIONES
// =====================================================
router.get('/transactions', paymentRateLimit({ max: 30 }), getTransactions);
router.get('/transactions/:id', paymentRateLimit({ max: 30 }), getTransaction);

// =====================================================
// CUENTAS BANCARIAS
// =====================================================
router.get('/bank-accounts', paymentRateLimit({ max: 30 }), getBankAccounts);
router.post(
  '/bank-accounts',
  paymentRateLimit({ max: 5, keyPrefix: 'bank_add' }),
  auditPayment('bank_account_add'),
  addBankAccount
);
router.delete(
  '/bank-accounts/:id',
  paymentRateLimit({ max: 10 }),
  auditPayment('bank_account_delete'),
  deleteBankAccount
);
router.put(
  '/bank-accounts/:id/default',
  paymentRateLimit({ max: 10 }),
  auditPayment('bank_account_default'),
  setDefaultBankAccount
);

// =====================================================
// MÉTODOS DE PAGO GUARDADOS
// =====================================================
router.get('/payment-methods', paymentRateLimit({ max: 30 }), getSavedPaymentMethods);
router.post(
  '/payment-methods',
  paymentRateLimit({ max: 5, keyPrefix: 'payment_add' }),
  auditPayment('payment_method_add'),
  addPaymentMethod
);
router.delete(
  '/payment-methods/:id',
  paymentRateLimit({ max: 10 }),
  auditPayment('payment_method_delete'),
  deletePaymentMethod
);
router.put(
  '/payment-methods/:id/default',
  paymentRateLimit({ max: 10 }),
  auditPayment('payment_method_default'),
  setDefaultPaymentMethod
);

export default router;
