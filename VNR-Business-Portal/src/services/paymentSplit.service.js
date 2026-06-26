import api from './api';

/**
 * Servicio de Division de Pagos
 * Gestiona la division de ganancias entre plataforma y conductor
 */
export const paymentSplitService = {
  // ==========================================
  // DIVISION DE PAGOS
  // ==========================================

  /**
   * Calcular division de pago (preview)
   * @param {number} amount - Monto total del servicio
   * @param {string} serviceType - Tipo de servicio (vuelta-segura, chofer, envio, flete)
   */
  async calculateSplit(amount, serviceType) {
    const response = await api.post('/payment-splits/calculate', { amount, serviceType });
    return response.data;
  },

  /**
   * Obtener division por ID de pago
   * @param {string} paymentId - ID del pago
   */
  async getSplitByPayment(paymentId) {
    const response = await api.get(`/payment-splits/payment/${paymentId}`);
    return response.data;
  },

  /**
   * Obtener divisiones del conductor actual
   * @param {Object} params - Parametros de filtrado
   * @param {number} params.page - Numero de pagina
   * @param {number} params.limit - Registros por pagina
   * @param {string} params.dateFrom - Fecha inicio
   * @param {string} params.dateTo - Fecha fin
   * @param {string} params.serviceType - Tipo de servicio
   */
  async getDriverSplits(params = {}) {
    const response = await api.get('/payment-splits/driver', { params });
    return response.data;
  },

  // ==========================================
  // COMISIONES
  // ==========================================

  /**
   * Obtener todas las configuraciones de comision
   */
  async getAllCommissions() {
    const response = await api.get('/payment-splits/commissions');
    return response.data;
  },

  /**
   * Obtener tasa de comision por tipo de servicio
   * @param {string} serviceType - Tipo de servicio
   */
  async getCommissionRate(serviceType) {
    const response = await api.get(`/payment-splits/commission/${serviceType}`);
    return response.data;
  },

  /**
   * Actualizar configuracion de comision (Admin)
   * @param {string} serviceType - Tipo de servicio
   * @param {Object} data - Datos de comision
   * @param {number} data.platformPercentage - Porcentaje plataforma
   * @param {number} data.driverPercentage - Porcentaje conductor
   * @param {number} data.minPlatformFee - Comision minima
   * @param {number} data.maxPlatformFee - Comision maxima
   */
  async updateCommission(serviceType, data) {
    const response = await api.put(`/payment-splits/commission/${serviceType}`, data);
    return response.data;
  },

  // ==========================================
  // PROPINAS
  // ==========================================

  /**
   * Enviar propina
   * @param {Object} data - Datos de la propina
   * @param {string} data.rideId - ID del viaje (opcional si hay deliveryId)
   * @param {string} data.deliveryId - ID del envio (opcional si hay rideId)
   * @param {number} data.amount - Monto de la propina
   * @param {number} data.percentage - Porcentaje de propina (opcional)
   * @param {string} data.message - Mensaje opcional
   */
  async sendTip(data) {
    const response = await api.post('/payment-splits/tip', data);
    return response.data;
  },

  /**
   * Obtener propinas recibidas (conductor)
   * @param {Object} params - Parametros de paginacion
   * @param {number} params.page - Numero de pagina
   * @param {number} params.limit - Registros por pagina
   */
  async getDriverTips(params = {}) {
    const response = await api.get('/payment-splits/tips', { params });
    return response.data;
  },

  // ==========================================
  // REPORTES (Admin)
  // ==========================================

  /**
   * Obtener resumen de ganancias de plataforma (Admin)
   * @param {Object} params - Parametros de filtrado
   * @param {string} params.dateFrom - Fecha inicio
   * @param {string} params.dateTo - Fecha fin
   * @param {string} params.serviceType - Tipo de servicio
   */
  async getPlatformSummary(params = {}) {
    const response = await api.get('/payment-splits/platform-summary', { params });
    return response.data;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Calcular propina sugerida
   * @param {number} totalAmount - Monto total del viaje
   * @param {number} percentage - Porcentaje (10, 15, 20)
   */
  calculateTipAmount(totalAmount, percentage) {
    return Math.round(totalAmount * (percentage / 100) * 100) / 100;
  },

  /**
   * Obtener opciones de propina predefinidas
   * @param {number} totalAmount - Monto total del viaje
   */
  getTipOptions(totalAmount) {
    return [
      { percentage: 10, amount: this.calculateTipAmount(totalAmount, 10), label: '10%' },
      { percentage: 15, amount: this.calculateTipAmount(totalAmount, 15), label: '15%' },
      { percentage: 20, amount: this.calculateTipAmount(totalAmount, 20), label: '20%' },
    ];
  },

  /**
   * Formatear monto como moneda argentina
   * @param {number} amount - Monto a formatear
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  },
};

export default paymentSplitService;
