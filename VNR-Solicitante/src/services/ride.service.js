import api from './api';
import mapsService from './maps.service';

// Configuración de precios
const PRICING = {
  basePrice: 500,      // Precio base en ARS
  pricePerKm: 150,     // Precio por km en ARS
  pricePerMin: 20,     // Precio por minuto en ARS
  minPrice: 800,       // Precio mínimo
  nightMultiplier: 1.3, // Multiplicador nocturno (22:00 - 06:00)
  surgeMultiplier: 1.0, // Multiplicador por demanda (dinámico)
};

export const rideService = {
  // ==========================================
  // MÉTODOS PARA USUARIOS (PASAJEROS)
  // ==========================================

  /**
   * Crear solicitud de viaje
   */
  async createRide(rideData) {
    const response = await api.post('/rides', rideData);
    return response.data;
  },

  /**
   * Obtener viajes del usuario
   */
  async getUserRides(params = {}) {
    const response = await api.get('/rides', { params });
    return response.data;
  },

  /**
   * Obtener viaje por ID
   */
  async getRideById(rideId) {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  },

  /**
   * Cancelar viaje
   */
  async cancelRide(rideId) {
    const response = await api.put(`/rides/${rideId}/cancel`);
    return response.data;
  },

  // ==========================================
  // MÉTODOS PARA CONDUCTORES
  // ==========================================

  /**
   * Obtener viajes disponibles para conductores
   */
  async getAvailableRides(lat, lng, radius = 10) {
    const response = await api.get('/rides/driver/available', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  /**
   * Obtener viajes del conductor
   */
  async getDriverRides(params = {}) {
    const response = await api.get('/rides/driver/rides', { params });
    return response.data;
  },

  /**
   * Aceptar un viaje
   */
  async acceptRide(rideId, vehicleId) {
    const response = await api.put(`/rides/${rideId}/accept`, { vehicleId });
    return response.data;
  },

  /**
   * Rechazar un viaje (conductor)
   */
  async rejectRide(rideId) {
    const response = await api.put(`/rides/${rideId}/reject`);
    return response.data;
  },

  /**
   * Actualizar estado del viaje (conductor)
   * @param {string} rideId - ID del viaje
   * @param {string} status - Nuevo estado: 'arrived', 'in_progress', 'completed'
   */
  async updateRideStatus(rideId, status) {
    const response = await api.put(`/rides/${rideId}/status`, { status });
    return response.data;
  },

  /**
   * Cancelar viaje como conductor
   */
  async driverCancelRide(rideId, reason = '') {
    const response = await api.put(`/rides/${rideId}/driver-cancel`, { reason });
    return response.data;
  },

  // ==========================================
  // COLA DE BÚSQUEDA DE CONDUCTORES
  // ==========================================

  /**
   * Obtener estado de la cola de búsqueda de conductores
   */
  async getQueueStatus(rideId) {
    const response = await api.get(`/rides/${rideId}/queue-status`);
    return response.data;
  },

  // ==========================================
  // UTILIDADES Y CÁLCULOS
  // ==========================================

  /**
   * Precio desde las tarifas del CRM (fuente de verdad, backend).
   * Devuelve el mismo precio que después se cobra; cae al cálculo local si falla.
   */
  async getEstimate(serviceType, distance, hours = 0) {
    try {
      const { data } = await api.get('/pricing/estimate', {
        params: { serviceType, distance, hours },
      });
      if (data?.success && typeof data.price === 'number') return data.price;
    } catch (e) {
      // respaldo local
    }
    return this.calculateEstimate(distance);
  },

  /**
   * Calcular precio estimado (simple, basado en distancia) - respaldo local
   * @deprecated Use getEstimate (tarifas del CRM)
   */
  calculateEstimate(distance) {
    return Math.max(
      PRICING.minPrice,
      Math.round(PRICING.basePrice + (distance * PRICING.pricePerKm))
    );
  },

  /**
   * Calcular duración estimada (simple, basado en distancia)
   * @deprecated Use getRouteEstimate for real calculations
   */
  calculateDuration(distance) {
    const minutesPerKm = 3;
    return Math.round(distance * minutesPerKm);
  },

  /**
   * Obtener estimación de ruta real usando Google Directions API
   * @param {object} origin - { latitude, longitude } o { lat, lng }
   * @param {object} destination - { latitude, longitude } o { lat, lng }
   * @returns {Promise<object>} Estimación con distancia, duración y precio reales
   */
  async getRouteEstimate(origin, destination) {
    try {
      // Normalizar coordenadas
      const originCoords = {
        latitude: origin.latitude || origin.lat,
        longitude: origin.longitude || origin.lng,
      };
      const destCoords = {
        latitude: destination.latitude || destination.lat,
        longitude: destination.longitude || destination.lng,
      };

      // Obtener ruta real de Google Directions
      const directions = await mapsService.getDirections(originCoords, destCoords);

      if (!directions?.primaryRoute) {
        // Fallback a cálculo simple si falla la API
        const distanceKm = mapsService.calculateDistance(originCoords, destCoords);
        return {
          distance: {
            value: distanceKm * 1000,
            text: `${distanceKm.toFixed(1)} km`,
            km: distanceKm,
          },
          duration: {
            value: this.calculateDuration(distanceKm) * 60,
            text: `${this.calculateDuration(distanceKm)} min`,
            minutes: this.calculateDuration(distanceKm),
          },
          price: this.calculateEstimate(distanceKm),
          polyline: null,
          isEstimate: true,
        };
      }

      const route = directions.primaryRoute;
      const distanceKm = route.totalDistance.value / 1000;
      const durationMin = Math.ceil(route.totalDuration.value / 60);

      // Calcular precio basado en distancia y tiempo reales
      const price = this.calculatePriceFromRoute(distanceKm, durationMin);

      return {
        distance: {
          value: route.totalDistance.value,
          text: route.totalDistance.text,
          km: distanceKm,
        },
        duration: {
          value: route.totalDuration.value,
          text: route.totalDuration.text,
          minutes: durationMin,
        },
        price,
        polyline: route.polyline,
        polylinePoints: mapsService.decodePolyline(route.polyline),
        bounds: route.bounds,
        isEstimate: false,
      };
    } catch (error) {
      console.error('Error getting route estimate:', error);

      // Fallback a cálculo simple
      const distanceKm = mapsService.calculateDistance(
        { latitude: origin.latitude || origin.lat, longitude: origin.longitude || origin.lng },
        { latitude: destination.latitude || destination.lat, longitude: destination.longitude || destination.lng }
      );

      return {
        distance: {
          value: distanceKm * 1000,
          text: `${distanceKm.toFixed(1)} km`,
          km: distanceKm,
        },
        duration: {
          value: this.calculateDuration(distanceKm) * 60,
          text: `${this.calculateDuration(distanceKm)} min`,
          minutes: this.calculateDuration(distanceKm),
        },
        price: this.calculateEstimate(distanceKm),
        polyline: null,
        isEstimate: true,
        error: error.message,
      };
    }
  },

  /**
   * Calcular precio basado en ruta real (distancia + tiempo)
   * @param {number} distanceKm - Distancia en km
   * @param {number} durationMin - Duración en minutos
   * @returns {number} Precio en ARS
   */
  calculatePriceFromRoute(distanceKm, durationMin) {
    let price = PRICING.basePrice;
    price += distanceKm * PRICING.pricePerKm;
    price += durationMin * PRICING.pricePerMin;

    // Aplicar multiplicador nocturno si aplica
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      price *= PRICING.nightMultiplier;
    }

    // Aplicar surge pricing si hay alta demanda
    price *= PRICING.surgeMultiplier;

    // Asegurar precio mínimo
    price = Math.max(PRICING.minPrice, price);

    // Redondear a múltiplos de 50
    return Math.ceil(price / 50) * 50;
  },

  /**
   * Obtener configuración de precios actual
   */
  getPricing() {
    return { ...PRICING };
  },
};

export default rideService;
