import api from './api';

/**
 * Servicio de Wallet para usuarios
 */
export const walletService = {
  // ==========================================
  // WALLET
  // ==========================================

  /**
   * Obtener wallet del usuario
   */
  async getWallet() {
    const response = await api.get('/wallet');
    return response.data;
  },

  /**
   * Obtener solo el saldo
   */
  async getBalance() {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  // ==========================================
  // DEPOSITOS
  // ==========================================

  /**
   * Iniciar recarga de saldo
   * @param {number} amount - Monto a recargar (min: $100, max: $50,000)
   */
  async initiateDeposit(amount) {
    const response = await api.post('/wallet/deposit', { amount });
    return response.data;
  },

  // ==========================================
  // RETIROS
  // ==========================================

  /**
   * Solicitar retiro de saldo
   * @param {number} amount - Monto a retirar (min: $500)
   * @param {string} bankAccountId - ID de la cuenta bancaria
   */
  async requestWithdrawal(amount, bankAccountId) {
    const response = await api.post('/wallet/withdraw', { amount, bankAccountId });
    return response.data;
  },

  // ==========================================
  // TRANSACCIONES
  // ==========================================

  /**
   * Obtener historial de transacciones
   * @param {Object} params - Parametros de paginacion
   * @param {number} params.page - Pagina (default: 1)
   * @param {number} params.limit - Limite por pagina (default: 20)
   * @param {string} params.type - Filtrar por tipo (deposit, withdrawal, payment, refund)
   */
  async getTransactions(params = {}) {
    const response = await api.get('/wallet/transactions', { params });
    return response.data;
  },

  /**
   * Obtener detalle de una transaccion
   * @param {string} transactionId - ID de la transaccion
   */
  async getTransaction(transactionId) {
    const response = await api.get(`/wallet/transactions/${transactionId}`);
    return response.data;
  },

  // ==========================================
  // CUENTAS BANCARIAS
  // ==========================================

  /**
   * Obtener cuentas bancarias del usuario
   */
  async getBankAccounts() {
    const response = await api.get('/wallet/bank-accounts');
    return response.data;
  },

  /**
   * Agregar cuenta bancaria
   * @param {Object} accountData - Datos de la cuenta
   * @param {string} accountData.bankName - Nombre del banco
   * @param {string} accountData.accountType - Tipo: 'savings' o 'checking'
   * @param {string} accountData.cbu - CBU (22 digitos)
   * @param {string} accountData.alias - Alias (opcional si hay CBU)
   * @param {string} accountData.holderName - Nombre del titular
   * @param {string} accountData.holderCuit - CUIT del titular
   */
  async addBankAccount(accountData) {
    const response = await api.post('/wallet/bank-accounts', accountData);
    return response.data;
  },

  /**
   * Eliminar cuenta bancaria
   * @param {string} accountId - ID de la cuenta
   */
  async deleteBankAccount(accountId) {
    const response = await api.delete(`/wallet/bank-accounts/${accountId}`);
    return response.data;
  },

  /**
   * Establecer cuenta bancaria por defecto
   * @param {string} accountId - ID de la cuenta
   */
  async setDefaultBankAccount(accountId) {
    const response = await api.put(`/wallet/bank-accounts/${accountId}/default`);
    return response.data;
  },

  // ==========================================
  // METODOS DE PAGO GUARDADOS
  // ==========================================

  /**
   * Obtener métodos de pago guardados del usuario
   */
  async getPaymentMethods() {
    const response = await api.get('/wallet/payment-methods');
    return response.data;
  },

  /**
   * Agregar método de pago (tarjeta)
   * @param {Object} paymentData - Datos del método de pago
   * @param {string} paymentData.paymentType - Tipo: 'card', 'debit_card', 'mercadopago'
   * @param {string} paymentData.cardNumber - Número de tarjeta (se tokeniza, solo se guarda últimos 4)
   * @param {number} paymentData.expiryMonth - Mes de vencimiento (1-12)
   * @param {number} paymentData.expiryYear - Año de vencimiento (YYYY)
   * @param {string} paymentData.cardholderName - Nombre del titular
   * @param {string} paymentData.securityCode - CVV (solo para validación, no se guarda)
   * @param {boolean} paymentData.setAsDefault - Establecer como método por defecto
   */
  async addPaymentMethod(paymentData) {
    const response = await api.post('/wallet/payment-methods', paymentData);
    return response.data;
  },

  /**
   * Eliminar método de pago
   * @param {string} paymentMethodId - ID del método de pago
   */
  async deletePaymentMethod(paymentMethodId) {
    const response = await api.delete(`/wallet/payment-methods/${paymentMethodId}`);
    return response.data;
  },

  /**
   * Establecer método de pago por defecto
   * @param {string} paymentMethodId - ID del método de pago
   */
  async setDefaultPaymentMethod(paymentMethodId) {
    const response = await api.put(`/wallet/payment-methods/${paymentMethodId}/default`);
    return response.data;
  },
};

export default walletService;
