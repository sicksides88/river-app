import api from './api';

/**
 * Servicio de Historial de Transacciones
 * Proporciona acceso a las funcionalidades avanzadas de transacciones
 */
export const transactionService = {
  /**
   * Obtener historial de transacciones con filtros avanzados
   * @param {Object} params - Parametros de busqueda
   * @param {number} params.page - Pagina (default: 1)
   * @param {number} params.limit - Limite por pagina (default: 20)
   * @param {string} params.type - Tipo (deposit, withdrawal, payment, refund, bonus)
   * @param {string} params.status - Estado (pending, completed, failed, cancelled)
   * @param {string} params.dateFrom - Fecha inicio (ISO string)
   * @param {string} params.dateTo - Fecha fin (ISO string)
   * @param {number} params.minAmount - Monto minimo
   * @param {number} params.maxAmount - Monto maximo
   * @param {string} params.referenceType - Tipo de referencia (ride, delivery, mercadopago)
   * @param {string} params.search - Busqueda en descripcion
   */
  async getTransactions(params = {}) {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  /**
   * Obtener detalle completo de una transaccion
   * Incluye informacion enriquecida del viaje/envio si aplica
   * @param {string} transactionId - ID de la transaccion
   */
  async getTransaction(transactionId) {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  /**
   * Obtener resumen de transacciones por periodo
   * @param {string} period - Periodo: 'day', 'week', 'month', 'year'
   */
  async getSummary(period = 'month') {
    const response = await api.get('/transactions/summary', { params: { period } });
    return response.data;
  },

  /**
   * Obtener estadisticas de transacciones
   * Incluye: total historico, ultimos 30 dias, tipo mas frecuente, etc.
   */
  async getStats() {
    const response = await api.get('/transactions/stats');
    return response.data;
  },

  /**
   * Exportar transacciones
   * @param {Object} params - Filtros para exportar
   * @param {string} params.format - Formato: 'csv' o 'json'
   * @param {string} params.dateFrom - Fecha inicio
   * @param {string} params.dateTo - Fecha fin
   * @param {string} params.type - Tipo de transaccion
   * @param {string} params.status - Estado
   */
  async exportTransactions(params = {}) {
    const response = await api.get('/transactions/export', {
      params,
      responseType: params.format === 'json' ? 'json' : 'blob',
    });
    return response.data;
  },

  /**
   * Obtener transacciones por rango de fechas
   * @param {string} dateFrom - Fecha inicio (ISO string)
   * @param {string} dateTo - Fecha fin (ISO string)
   */
  async getByDateRange(dateFrom, dateTo) {
    const response = await api.get('/transactions/range', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Obtener icono segun tipo de transaccion
   */
  getTransactionIcon(type) {
    const icons = {
      deposit: 'arrow-down-circle',
      withdrawal: 'arrow-up-circle',
      payment: 'cart',
      refund: 'refresh-circle',
      bonus: 'gift',
    };
    return icons[type] || 'swap-horizontal';
  },

  /**
   * Obtener color segun tipo de transaccion
   * @param {string} type - Tipo de transaccion
   * @param {Object} colors - Objeto con colores del tema
   */
  getTransactionColor(type, colors) {
    const colorMap = {
      deposit: colors.success,
      refund: colors.success,
      bonus: colors.success,
      withdrawal: colors.error,
      payment: colors.error,
    };
    return colorMap[type] || colors.text;
  },

  /**
   * Obtener etiqueta localizada segun tipo
   */
  getTransactionLabel(type) {
    const labels = {
      deposit: 'Recarga',
      withdrawal: 'Retiro',
      payment: 'Pago',
      refund: 'Reembolso',
      bonus: 'Bonificacion',
    };
    return labels[type] || type;
  },

  /**
   * Obtener etiqueta de estado
   */
  getStatusLabel(status) {
    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  },

  /**
   * Obtener color de estado
   */
  getStatusColor(status, colors) {
    const colorMap = {
      pending: colors.warning,
      completed: colors.success,
      failed: colors.error,
      cancelled: colors.textMuted,
    };
    return colorMap[status] || colors.text;
  },

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString, options = {}) {
    const date = new Date(dateString);
    const defaultOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('es-AR', { ...defaultOptions, ...options });
  },

  /**
   * Formatear fecha corta
   */
  formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  },

  /**
   * Verificar si es ingreso (positivo)
   */
  isIncome(type) {
    return ['deposit', 'refund', 'bonus'].includes(type);
  },

  /**
   * Verificar si es egreso (negativo)
   */
  isExpense(type) {
    return ['withdrawal', 'payment'].includes(type);
  },
};

export default transactionService;
