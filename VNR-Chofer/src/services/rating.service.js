import api from './api';

/**
 * Servicio de Calificaciones para el frontend
 * Maneja la comunicación con la API de ratings
 */
export const ratingService = {
  // ==========================================
  // CREAR CALIFICACIONES
  // ==========================================

  /**
   * Crear calificación de un viaje
   * @param {Object} data - Datos de la calificación
   * @param {string} data.rideId - ID del viaje
   * @param {string} data.ratedId - ID del usuario a calificar
   * @param {number} data.stars - Estrellas (1-5)
   * @param {string} data.comment - Comentario opcional
   * @param {string[]} data.tags - Tags seleccionados
   */
  async rateRide(data) {
    const response = await api.post('/ratings/ride', data);
    return response.data;
  },

  /**
   * Crear calificación de una entrega
   * @param {Object} data - Datos de la calificación
   */
  async rateDelivery(data) {
    const response = await api.post('/ratings/delivery', data);
    return response.data;
  },

  // ==========================================
  // OBTENER CALIFICACIONES
  // ==========================================

  /**
   * Obtener mis calificaciones recibidas
   * @param {Object} params - Parámetros de paginación
   */
  async getMyRatings(params = {}) {
    const response = await api.get('/ratings/me', { params });
    return response.data;
  },

  /**
   * Obtener mis estadísticas de calificación
   */
  async getMyStats() {
    const response = await api.get('/ratings/me/stats');
    return response.data;
  },

  /**
   * Obtener calificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} params - Parámetros de paginación
   */
  async getUserRatings(userId, params = {}) {
    const response = await api.get(`/ratings/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Obtener estadísticas de un usuario
   * @param {string} userId - ID del usuario
   */
  async getUserStats(userId) {
    const response = await api.get(`/ratings/user/${userId}/stats`);
    return response.data;
  },

  /**
   * Verificar si puedo calificar un viaje
   * @param {string} rideId - ID del viaje
   */
  async canRateRide(rideId) {
    const response = await api.get(`/ratings/can-rate/ride/${rideId}`);
    return response.data;
  },

  /**
   * Obtener mi calificación de un viaje (si existe)
   * @param {string} rideId - ID del viaje
   */
  async getRideRating(rideId) {
    const response = await api.get(`/ratings/ride/${rideId}`);
    return response.data;
  },

  /**
   * Obtener tags disponibles para calificación
   * @param {string} type - 'user_to_driver' o 'driver_to_user'
   * @param {number} stars - Número de estrellas (para filtrar tags)
   */
  async getTags(type = 'user_to_driver', stars = null) {
    const params = { type };
    if (stars !== null) {
      params.stars = stars;
    }
    const response = await api.get('/ratings/tags', { params });
    return response.data;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Formatear rating para mostrar
   * @param {number} rating - Rating promedio
   */
  formatRating(rating) {
    if (!rating || rating === 0) return '5.0';
    return parseFloat(rating).toFixed(1);
  },

  /**
   * Obtener texto descriptivo del rating
   * @param {number} stars - Número de estrellas
   */
  getRatingText(stars) {
    const texts = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente',
    };
    return texts[stars] || '';
  },

  /**
   * Obtener color según el rating
   * @param {number} rating - Rating promedio
   */
  getRatingColor(rating) {
    if (rating >= 4.5) return '#4CAF50'; // Verde
    if (rating >= 4.0) return '#8BC34A'; // Verde claro
    if (rating >= 3.5) return '#FFC107'; // Amarillo
    if (rating >= 3.0) return '#FF9800'; // Naranja
    return '#F44336'; // Rojo
  },

  /**
   * Generar array de estrellas para renderizar
   * @param {number} rating - Rating (puede ser decimal)
   * @param {number} maxStars - Máximo de estrellas (default: 5)
   */
  getStarsArray(rating, maxStars = 5) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= maxStars; i++) {
      if (i <= fullStars) {
        stars.push({ type: 'full', key: i });
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push({ type: 'half', key: i });
      } else {
        stars.push({ type: 'empty', key: i });
      }
    }

    return stars;
  },

  /**
   * Calcular porcentaje para barra de distribución
   * @param {number} count - Cantidad de ratings con X estrellas
   * @param {number} total - Total de ratings
   */
  getDistributionPercentage(count, total) {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  },
};

export default ratingService;
