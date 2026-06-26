import api from './api';

export const deliveryService = {
  // ==========================================
  // MÉTODOS PARA USUARIOS
  // ==========================================

  /**
   * Crear solicitud de envío
   */
  async createDelivery(deliveryData) {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  },

  /**
   * Obtener envíos del usuario
   */
  async getUserDeliveries(params = {}) {
    const response = await api.get('/deliveries', { params });
    return response.data;
  },

  /**
   * Obtener envío por ID
   */
  async getDeliveryById(deliveryId) {
    const response = await api.get(`/deliveries/${deliveryId}`);
    return response.data;
  },

  /**
   * Rastrear envío por número de tracking
   */
  async trackDelivery(trackingNumber) {
    const response = await api.get(`/deliveries/track/${trackingNumber}`);
    return response.data;
  },

  /**
   * Cancelar envío
   * @param {string} deliveryId - ID del envío
   * @param {string} reason - Motivo de cancelación (opcional)
   */
  async cancelDelivery(deliveryId, reason = '') {
    const response = await api.put(`/deliveries/${deliveryId}/cancel`, { reason });
    return response.data;
  },

  // ==========================================
  // MÉTODOS PARA CADETES (CONDUCTORES DE ENVÍOS)
  // ==========================================

  /**
   * Obtener envíos disponibles para cadetes
   */
  async getAvailableDeliveries(lat, lng, radius = 10) {
    const response = await api.get('/deliveries/cadete/available', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  /**
   * Obtener envíos del cadete (historial)
   */
  async getCadeteDeliveries(params = {}) {
    const response = await api.get('/deliveries/cadete/deliveries', { params });
    return response.data;
  },

  /**
   * Aceptar un envío
   */
  async acceptDelivery(deliveryId, vehicleId) {
    const response = await api.put(`/deliveries/${deliveryId}/accept`, { vehicleId });
    return response.data;
  },

  /**
   * Actualizar estado del envío (cadete)
   * Estados válidos: 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff', 'delivered'
   */
  async updateDeliveryStatus(deliveryId, status, code) {
    const body = { status };
    // Al entregar, el cadete envía el PIN que le dicta quien recibe el paquete
    if (code) body.code = code;
    const response = await api.put(`/deliveries/${deliveryId}/status`, body);
    return response.data;
  },

  /**
   * Cancelar envío como cadete
   */
  async cadeteCancelDelivery(deliveryId, reason = '') {
    const response = await api.put(`/deliveries/${deliveryId}/cadete-cancel`, { reason });
    return response.data;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Calcular precio estimado para envío
   */
  calculateDeliveryEstimate(distance, weight = 0) {
    const basePrice = 400;
    const pricePerKm = 120;
    const weightFactor = weight > 3 ? (weight - 3) * 50 : 0;
    return Math.round(basePrice + (distance * pricePerKm) + weightFactor);
  },

  /**
   * Calcular precio para flete
   */
  calculateFleteEstimate(distance, weight = 0) {
    const basePrice = 1000;
    const pricePerKm = 200;
    const weightFactor = weight > 10 ? (weight - 10) * 30 : 0;
    return Math.round(basePrice + (distance * pricePerKm) + weightFactor);
  },
};

export default deliveryService;
