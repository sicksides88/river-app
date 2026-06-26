import api from './api';

/**
 * Servicio para operaciones del usuario
 */
const userService = {
  /**
   * Obtener historial de viajes y envíos del usuario
   * @param {Object} options - Opciones de filtrado y paginación
   * @param {number} options.page - Número de página (default: 1)
   * @param {number} options.limit - Cantidad de items por página (default: 20)
   * @param {string} options.serviceType - Tipo de servicio ('vuelta_segura', 'envio', 'flete', 'chofer')
   * @returns {Promise<Object>} - Historial de actividades
   */
  async getHistory({ page = 1, limit = 20, serviceType = null } = {}) {
    try {
      const params = { page, limit };
      if (serviceType) {
        params.serviceType = serviceType;
      }

      const response = await api.get('/users/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },

  /**
   * Actualizar perfil del usuario
   * @param {Object} profileData - Datos del perfil a actualizar
   * @returns {Promise<Object>} - Perfil actualizado
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Obtener viaje o envío activo del usuario
   * @returns {Promise<Object>} - Viaje/envío activo o null
   */
  async getActiveTrip() {
    try {
      const response = await api.get('/users/active-trip');
      return response.data;
    } catch (error) {
      console.error('Error fetching active trip:', error);
      throw error;
    }
  },
};

export default userService;
