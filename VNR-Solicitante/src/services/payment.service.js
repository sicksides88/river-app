import api from './api';

/**
 * Servicio de Pagos
 */
export const paymentService = {
  // ==========================================
  // PROCESAR PAGOS
  // ==========================================

  /**
   * Procesar un pago
   * @param {Object} paymentData - Datos del pago
   * @param {string} paymentData.rideId - ID del viaje (opcional)
   * @param {string} paymentData.deliveryId - ID del envio (opcional)
   * @param {number} paymentData.amount - Monto total
   * @param {number} paymentData.tip - Propina (opcional)
   * @param {string} paymentData.paymentMethod - Metodo: 'wallet', 'mercadopago', 'card', 'cash'
   * @param {string} paymentData.description - Descripcion (opcional)
   */
  async processPayment(paymentData) {
    const response = await api.post('/payments/process', paymentData);
    return response.data;
  },

  /**
   * Obtener metodos de pago disponibles
   */
  async getPaymentMethods() {
    const response = await api.get('/payments/methods');
    return response.data;
  },

  // ==========================================
  // HISTORIAL
  // ==========================================

  /**
   * Obtener historial de pagos
   * @param {Object} params - Parametros de paginacion
   * @param {number} params.page - Pagina
   * @param {number} params.limit - Limite por pagina
   */
  async getPayments(params = {}) {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  /**
   * Obtener detalle de un pago
   * @param {string} paymentId - ID del pago
   */
  async getPayment(paymentId) {
    const response = await api.get(`/payments/${paymentId}`);
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
   * Obtener icono por metodo de pago
   * @param {string} method - Metodo de pago
   */
  getPaymentMethodIcon(method) {
    const icons = {
      wallet: 'wallet-outline',
      mercadopago: 'logo-usd',
      card: 'card-outline',
      cash: 'cash-outline',
    };
    return icons[method] || 'help-circle-outline';
  },

  /**
   * Obtener nombre por metodo de pago
   * @param {string} method - Metodo de pago
   */
  getPaymentMethodName(method) {
    const names = {
      wallet: 'Saldo VNR',
      mercadopago: 'MercadoPago',
      card: 'Tarjeta',
      cash: 'Efectivo',
    };
    return names[method] || method;
  },

  /**
   * Obtener color por estado de pago
   * @param {string} status - Estado
   */
  getPaymentStatusColor(status) {
    const colors = {
      pending: '#FFA500',
      processing: '#2196F3',
      approved: '#4CAF50',
      rejected: '#F44336',
      refunded: '#9C27B0',
      cancelled: '#9E9E9E',
    };
    return colors[status] || '#9E9E9E';
  },

  /**
   * Obtener texto por estado de pago
   * @param {string} status - Estado
   */
  getPaymentStatusText(status) {
    const texts = {
      pending: 'Pendiente',
      processing: 'Procesando',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado',
    };
    return texts[status] || status;
  },
};

export default paymentService;
