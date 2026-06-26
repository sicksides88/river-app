import api from './api';

/**
 * Servicio de Reembolsos
 * Gestiona solicitudes de reembolso desde el frontend
 */
export const refundService = {
  // ==========================================
  // SOLICITUDES DE REEMBOLSO
  // ==========================================

  /**
   * Solicitar un reembolso
   * @param {Object} data - Datos de la solicitud
   * @param {string} data.paymentId - ID del pago a reembolsar
   * @param {string} data.rideId - ID del viaje (opcional)
   * @param {string} data.deliveryId - ID del envío (opcional)
   * @param {string} data.reason - Motivo del reembolso
   * @param {string} data.reasonDetails - Detalles adicionales
   */
  async requestRefund(data) {
    const response = await api.post('/refunds', data);
    return response.data;
  },

  /**
   * Obtener mis reembolsos
   * @param {Object} params - Parámetros de filtrado
   * @param {number} params.page - Número de página
   * @param {number} params.limit - Registros por página
   * @param {string} params.status - Filtrar por estado
   */
  async getMyRefunds(params = {}) {
    const response = await api.get('/refunds', { params });
    return response.data;
  },

  /**
   * Obtener detalle de un reembolso
   * @param {string} refundId - ID del reembolso
   */
  async getRefundById(refundId) {
    const response = await api.get(`/refunds/${refundId}`);
    return response.data;
  },

  /**
   * Cancelar solicitud de reembolso
   * @param {string} refundId - ID del reembolso
   */
  async cancelRefund(refundId) {
    const response = await api.put(`/refunds/${refundId}/cancel`);
    return response.data;
  },

  /**
   * Calcular monto de reembolso (preview)
   * @param {number} originalAmount - Monto original del pago
   * @param {string} reason - Motivo del reembolso
   */
  async calculateRefund(originalAmount, reason) {
    const response = await api.post('/refunds/calculate', { originalAmount, reason });
    return response.data;
  },

  /**
   * Obtener políticas de reembolso
   */
  async getRefundPolicies() {
    const response = await api.get('/refunds/policies');
    return response.data;
  },

  // ==========================================
  // ADMINISTRACIÓN (Admin)
  // ==========================================

  /**
   * Obtener reembolsos pendientes (Admin)
   * @param {Object} params - Parámetros de paginación
   */
  async getPendingRefunds(params = {}) {
    const response = await api.get('/refunds/admin/pending', { params });
    return response.data;
  },

  /**
   * Aprobar reembolso (Admin)
   * @param {string} refundId - ID del reembolso
   */
  async approveRefund(refundId) {
    const response = await api.put(`/refunds/${refundId}/approve`);
    return response.data;
  },

  /**
   * Rechazar reembolso (Admin)
   * @param {string} refundId - ID del reembolso
   * @param {string} rejectionReason - Motivo del rechazo
   */
  async rejectRefund(refundId, rejectionReason) {
    const response = await api.put(`/refunds/${refundId}/reject`, { rejectionReason });
    return response.data;
  },

  /**
   * Obtener estadísticas de reembolsos (Admin)
   * @param {Object} params - Parámetros de filtrado
   * @param {string} params.dateFrom - Fecha inicio
   * @param {string} params.dateTo - Fecha fin
   */
  async getRefundStats(params = {}) {
    const response = await api.get('/refunds/admin/stats', { params });
    return response.data;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Obtener motivos de reembolso disponibles
   */
  getRefundReasons() {
    return [
      {
        value: 'cancelled_before_assignment',
        label: 'Cancelé antes de asignar conductor',
        description: 'Reembolso total (100%)',
      },
      {
        value: 'cancelled_after_assignment',
        label: 'Cancelé después de asignar conductor',
        description: 'Reembolso parcial (80%)',
      },
      {
        value: 'cancelled_driver_enroute',
        label: 'Cancelé con conductor en camino',
        description: 'Reembolso parcial (50%)',
      },
      {
        value: 'driver_no_show',
        label: 'El conductor no llegó',
        description: 'Reembolso total (100%)',
      },
      {
        value: 'service_not_completed',
        label: 'El servicio no se completó',
        description: 'Reembolso proporcional',
      },
      {
        value: 'poor_service',
        label: 'Servicio de mala calidad',
        description: 'Sujeto a revisión (hasta 50%)',
      },
      {
        value: 'overcharge',
        label: 'Cobro excesivo',
        description: 'Diferencia del monto',
      },
      {
        value: 'duplicate_charge',
        label: 'Cobro duplicado',
        description: 'Reembolso total del duplicado',
      },
      {
        value: 'technical_error',
        label: 'Error técnico',
        description: 'Reembolso total (100%)',
      },
      {
        value: 'other',
        label: 'Otro motivo',
        description: 'Requiere revisión manual',
      },
    ];
  },

  /**
   * Obtener etiqueta de estado
   * @param {string} status - Código de estado
   */
  getStatusLabel(status) {
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      processing: 'En proceso',
      completed: 'Completado',
      rejected: 'Rechazado',
      failed: 'Fallido',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  },

  /**
   * Obtener color de estado para UI
   * @param {string} status - Código de estado
   */
  getStatusColor(status) {
    const colors = {
      pending: '#FFA500',     // Naranja
      approved: '#4CAF50',    // Verde
      processing: '#2196F3',  // Azul
      completed: '#4CAF50',   // Verde
      rejected: '#F44336',    // Rojo
      failed: '#F44336',      // Rojo
      cancelled: '#9E9E9E',   // Gris
    };
    return colors[status] || '#9E9E9E';
  },

  /**
   * Obtener etiqueta del motivo
   * @param {string} reason - Código del motivo
   */
  getReasonLabel(reason) {
    const reasons = this.getRefundReasons();
    const found = reasons.find(r => r.value === reason);
    return found ? found.label : reason;
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

export default refundService;
