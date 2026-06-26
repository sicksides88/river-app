import api from './api';

/**
 * Servicio de Wallet para conductores
 */
export const driverWalletService = {
  // ==========================================
  // WALLET
  // ==========================================

  /**
   * Obtener wallet del conductor
   */
  async getWallet() {
    const response = await api.get('/driver/wallet');
    return response.data;
  },

  /**
   * Obtener saldos del conductor
   */
  async getBalance() {
    const response = await api.get('/driver/wallet/balance');
    return response.data;
  },

  // ==========================================
  // GANANCIAS
  // ==========================================

  /**
   * Obtener historial de ganancias
   * @param {Object} params - Parametros
   * @param {number} params.page - Pagina (default: 1)
   * @param {number} params.limit - Limite por pagina (default: 20)
   * @param {string} params.status - Filtrar por estado (pending, available, withdrawn)
   * @param {string} params.period - Periodo (today, week, month)
   */
  async getEarnings(params = {}) {
    const response = await api.get('/driver/wallet/earnings', { params });
    return response.data;
  },

  /**
   * Obtener ganancias del dia
   */
  async getTodayEarnings() {
    const response = await api.get('/driver/wallet/earnings/today');
    return response.data;
  },

  /**
   * Obtener ganancias de la semana
   */
  async getWeekEarnings() {
    const response = await api.get('/driver/wallet/earnings/week');
    return response.data;
  },

  /**
   * Obtener ganancias del mes
   */
  async getMonthEarnings() {
    const response = await api.get('/driver/wallet/earnings/month');
    return response.data;
  },

  // ==========================================
  // RETIROS
  // ==========================================

  /**
   * Solicitar retiro de ganancias
   * @param {number} amount - Monto a retirar (min: $1,000)
   * @param {string} bankAccountId - ID de la cuenta bancaria
   */
  async requestWithdrawal(amount, bankAccountId) {
    const response = await api.post('/driver/wallet/withdraw', { amount, bankAccountId });
    return response.data;
  },

  /**
   * Obtener historial de retiros
   * @param {Object} params - Parametros
   * @param {number} params.page - Pagina (default: 1)
   * @param {number} params.limit - Limite por pagina (default: 20)
   * @param {string} params.status - Filtrar por estado
   */
  async getWithdrawals(params = {}) {
    const response = await api.get('/driver/wallet/withdrawals', { params });
    return response.data;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Formatear moneda
   * @param {number} amount - Monto
   * @param {string} currency - Moneda (default: ARS)
   */
  formatCurrency(amount, currency = 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Obtener color por estado de ganancia
   * @param {string} status - Estado
   */
  getEarningStatusColor(status) {
    const colors = {
      pending: '#FFA500',
      available: '#4CAF50',
      withdrawn: '#9E9E9E',
    };
    return colors[status] || '#9E9E9E';
  },

  /**
   * Obtener texto por estado de ganancia
   * @param {string} status - Estado
   */
  getEarningStatusText(status) {
    const texts = {
      pending: 'Pendiente',
      available: 'Disponible',
      withdrawn: 'Retirado',
    };
    return texts[status] || status;
  },
};

export default driverWalletService;
