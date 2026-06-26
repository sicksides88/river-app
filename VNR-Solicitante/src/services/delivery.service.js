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
  async updateDeliveryStatus(deliveryId, status) {
    const response = await api.put(`/deliveries/${deliveryId}/status`, { status });
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
   * Precio estimado desde las tarifas del CRM (fuente de verdad, backend).
   * Devuelve el mismo precio que después se cobra. Si el backend falla,
   * cae al cálculo local como respaldo.
   * @param {string} serviceType - 'envio' | 'flete' | 'vuelta-segura' | 'chofer'
   * @param {number} distance - distancia en km
   * @param {number} hours - horas (para servicios por hora)
   */
  async getEstimate(serviceType, distance, hours = 0) {
    try {
      const { data } = await api.get('/pricing/estimate', {
        params: { serviceType, distance, hours },
      });
      if (data?.success && typeof data.price === 'number') return data.price;
    } catch (e) {
      // Respaldo local si el backend no responde
    }
    return serviceType === 'flete' || serviceType === 'fletes'
      ? this.calculateFleteEstimate(distance)
      : this.calculateDeliveryEstimate(distance);
  },

  /**
   * Calcular precio estimado para envío (respaldo local)
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
