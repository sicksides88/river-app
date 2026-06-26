import api from './api';

/**
 * Servicio de Notificaciones para el frontend
 * Maneja la comunicacion con la API de notificaciones
 */
export const notificationService = {
  // ==========================================
  // GESTION DE TOKENS
  // ==========================================

  /**
   * Registrar token de push en el servidor
   * @param {string} token - Token de Expo/FCM
   * @param {Object} deviceInfo - Informacion del dispositivo
   */
  async registerToken(token, deviceInfo = {}) {
    const response = await api.post('/notifications/token', {
      token,
      ...deviceInfo,
    });
    return response.data;
  },

  /**
   * Eliminar token de push del servidor
   * @param {string} token - Token a eliminar
   */
  async removeToken(token) {
    try {
      const response = await api.delete('/notifications/token', {
        data: { token },
      });
      return response.data;
    } catch (error) {
      // No fallar si esto falla
      console.warn('Error eliminando token:', error.message);
      return { success: false };
    }
  },

  /**
   * Desactivar todos los tokens (logout)
   */
  async logoutTokens() {
    try {
      const response = await api.post('/notifications/logout');
      return response.data;
    } catch (error) {
      // No fallar el logout si esto falla
      console.warn('Error desactivando tokens:', error.message);
      return { success: false };
    }
  },

  // ==========================================
  // NOTIFICACIONES
  // ==========================================

  /**
   * Obtener notificaciones del usuario
   * @param {Object} params - Parametros de paginacion
   * @param {number} params.page - Pagina (default: 1)
   * @param {number} params.limit - Limite por pagina (default: 20)
   */
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  /**
   * Obtener conteo de notificaciones no leidas
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Marcar notificacion como leida
   * @param {string} notificationId - ID de la notificacion
   */
  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Marcar todas las notificaciones como leidas
   */
  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  /**
   * Eliminar notificacion
   * @param {string} notificationId - ID de la notificacion
   */
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Enviar notificacion de prueba (solo desarrollo)
   * @param {Object} notification - Datos de la notificacion
   */
  async sendTestNotification(notification = {}) {
    const response = await api.post('/notifications/test', notification);
    return response.data;
  },

  // ==========================================
  // PREFERENCIAS DE NOTIFICACIONES
  // ==========================================

  /**
   * Obtener preferencias del usuario
   */
  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Obtener resumen de preferencias para UI
   */
  async getPreferencesSummary() {
    const response = await api.get('/notifications/preferences/summary');
    return response.data;
  },

  /**
   * Actualizar preferencias
   * @param {Object} updates - Campos a actualizar
   */
  async updatePreferences(updates) {
    const response = await api.put('/notifications/preferences', updates);
    return response.data;
  },

  /**
   * Activar/desactivar categoria de notificaciones
   * @param {string} category - ID de la categoria
   * @param {boolean} enabled - Estado a establecer
   */
  async toggleCategory(category, enabled) {
    const response = await api.put(`/notifications/preferences/category/${category}`, { enabled });
    return response.data;
  },

  /**
   * Configurar quiet hours
   * @param {boolean} enabled - Activar/desactivar
   * @param {string} startTime - Hora inicio (HH:MM)
   * @param {string} endTime - Hora fin (HH:MM)
   */
  async setQuietHours(enabled, startTime, endTime) {
    const response = await api.put('/notifications/preferences/quiet-hours', {
      enabled,
      startTime,
      endTime,
    });
    return response.data;
  },

  /**
   * Activar/desactivar sonido
   * @param {boolean} enabled - Estado
   */
  async toggleSound(enabled) {
    const response = await api.put('/notifications/preferences/sound', { enabled });
    return response.data;
  },

  /**
   * Activar/desactivar vibracion
   * @param {boolean} enabled - Estado
   */
  async toggleVibration(enabled) {
    const response = await api.put('/notifications/preferences/vibration', { enabled });
    return response.data;
  },

  /**
   * Restablecer preferencias a valores por defecto
   */
  async resetPreferences() {
    const response = await api.post('/notifications/preferences/reset');
    return response.data;
  },

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Obtener icono segun tipo de notificacion
   * @param {string} type - Tipo de notificacion
   */
  getNotificationIcon(type) {
    const icons = {
      ride_accepted: 'car',
      ride_completed: 'checkmark-circle',
      ride_cancelled: 'close-circle',
      driver_nearby: 'location',
      driver_arrived: 'flag',
      new_ride_available: 'flash',
      payment_received: 'cash',
      wallet_deposit: 'wallet',
      wallet_withdrawal: 'arrow-down',
      earning_available: 'trending-up',
      new_message: 'chatbubble',
      rating_reminder: 'star',
      promo_offer: 'gift',
      system_alert: 'alert-circle',
      default: 'notifications',
    };
    return icons[type] || icons.default;
  },

  /**
   * Obtener color segun tipo de notificacion
   * @param {string} type - Tipo de notificacion
   */
  getNotificationColor(type) {
    const colors = {
      ride_accepted: '#4CAF50',
      ride_completed: '#4CAF50',
      ride_cancelled: '#F44336',
      driver_nearby: '#2196F3',
      driver_arrived: '#4CAF50',
      new_ride_available: '#FF9800',
      payment_received: '#4CAF50',
      wallet_deposit: '#4CAF50',
      wallet_withdrawal: '#2196F3',
      earning_available: '#4CAF50',
      new_message: '#2196F3',
      rating_reminder: '#FF9800',
      promo_offer: '#9C27B0',
      system_alert: '#F44336',
      default: '#757575',
    };
    return colors[type] || colors.default;
  },

  /**
   * Formatear tiempo relativo
   * @param {string} dateString - Fecha en formato ISO
   */
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Ahora';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else {
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
      });
    }
  },
};

export default notificationService;
