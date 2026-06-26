import api from './api';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

/**
 * Servicio de OAuth de MercadoPago para conductores
 * Permite conectar/desconectar cuenta MP para recibir pagos directos
 */
const mercadopagoOAuthService = {
  /**
   * Obtiene el estado de conexión de MercadoPago
   * @returns {Promise<Object>} Estado de la conexión
   */
  async getConnectionStatus() {
    try {
      const response = await api.get('/driver/mercadopago/status');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado MP:', error);
      throw error;
    }
  },

  /**
   * Inicia el flujo OAuth para conectar cuenta de MercadoPago
   * Abre el navegador para autorización
   * @returns {Promise<Object>} Resultado del flujo OAuth
   */
  async connectAccount() {
    try {
      // 1. Obtener URL de autorización del backend
      const response = await api.get('/driver/mercadopago/connect');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error obteniendo URL de conexión');
      }

      const { authorizationUrl } = response.data;

      // 2. Abrir navegador — el backend hace todo el trabajo (exchange + save)
      await WebBrowser.openBrowserAsync(authorizationUrl);

      // 3. Al volver a la app, verificar si la conexión fue exitosa
      const status = await this.getConnectionStatus();
      return {
        success: status.connected,
        message: status.connected
          ? 'Cuenta de MercadoPago conectada correctamente'
          : 'No se completó la conexión. Intenta de nuevo.',
        mpEmail: status.mpEmail,
      };
    } catch (error) {
      console.error('Error conectando cuenta MP:', error);
      throw error;
    }
  },

  /**
   * Desconecta la cuenta de MercadoPago
   * @returns {Promise<Object>} Resultado de la desconexión
   */
  async disconnectAccount() {
    try {
      const response = await api.post('/driver/mercadopago/disconnect');
      return response.data;
    } catch (error) {
      console.error('Error desconectando cuenta MP:', error);
      throw error;
    }
  },

  /**
   * Refresca el token manualmente (para testing)
   * @returns {Promise<Object>} Resultado del refresh
   */
  async refreshToken() {
    try {
      const response = await api.post('/driver/mercadopago/refresh');
      return response.data;
    } catch (error) {
      console.error('Error refrescando token MP:', error);
      throw error;
    }
  },
};

export default mercadopagoOAuthService;
