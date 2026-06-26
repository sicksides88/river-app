import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationService } from './notification.service';

// Configurar como se muestran las notificaciones cuando la app esta en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Servicio de Push Notifications
 * Maneja el registro de tokens y recepcion de notificaciones
 */
export const pushNotificationService = {
  /**
   * Token de Expo Push actual
   */
  expoPushToken: null,

  /**
   * Verificar si estamos en Expo Go
   */
  isExpoGo() {
    return Constants.appOwnership === 'expo';
  },

  /**
   * Registrar para recibir push notifications
   * @returns {Promise<string|null>} Token de Expo Push o null si falla
   */
  async registerForPushNotifications() {
    // En Expo Go SDK 53+, las push remotas no están disponibles
    // Solo funciona con development builds o en producción
    if (this.isExpoGo()) {
      console.log('📱 Expo Go: Push notifications remotas no disponibles');
      return null;
    }

    // Solo funciona en dispositivos fisicos
    if (!Device.isDevice) {
      console.log('📱 Push notifications solo funcionan en dispositivos fisicos');
      return null;
    }

    // Verificar permisos existentes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Solicitar permisos si no los tiene
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('📱 Permiso de notificaciones denegado');
      return null;
    }

    // Configuracion especial para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vnr_notifications', {
        name: 'VNR Notificaciones',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#000000',
        sound: 'default',
      });
    }

    // Obtener el token de Expo Push
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('📱 No hay projectId configurado para push notifications');
        return null;
      }

      const response = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = response.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.log('📱 Error obteniendo push token:', error.message);
      return null;
    }
  },

  /**
   * Registrar token en el servidor
   * @param {string} token - Token de Expo Push
   */
  async sendTokenToServer(token) {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        deviceId: Constants.deviceId,
        deviceName: Device.deviceName,
        appVersion: Constants.expoConfig?.version || '1.0.0',
      };

      const result = await notificationService.registerToken(token, deviceInfo);
      return result;
    } catch (error) {
      console.error('Error enviando token al servidor:', error);
      return { success: false, error };
    }
  },

  /**
   * Proceso completo de registro
   * Obtiene permisos, token y lo envia al servidor
   */
  async register() {
    const token = await this.registerForPushNotifications();
    if (token) {
      await this.sendTokenToServer(token);
    }
    return token;
  },

  /**
   * Eliminar token del servidor (al cerrar sesion)
   */
  async unregister() {
    try {
      if (this.expoPushToken) {
        await notificationService.removeToken(this.expoPushToken);
        this.expoPushToken = null;
      }
      // Tambien desactivar todos los tokens
      await notificationService.logoutTokens();
      return { success: true };
    } catch (error) {
      console.error('Error eliminando token:', error);
      return { success: false, error };
    }
  },

  /**
   * Agregar listener para notificaciones recibidas (foreground)
   * @param {Function} callback - Funcion a ejecutar
   * @returns {Object} Subscription para remover listener
   */
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Agregar listener para cuando el usuario toca una notificacion
   * @param {Function} callback - Funcion a ejecutar
   * @returns {Object} Subscription para remover listener
   */
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Obtener la ultima notificacion que abrio la app
   */
  async getLastNotificationResponse() {
    return Notifications.getLastNotificationResponseAsync();
  },

  /**
   * Programar una notificacion local
   * @param {Object} content - Contenido de la notificacion
   * @param {Object} trigger - Trigger de la notificacion
   */
  async scheduleLocalNotification(content, trigger = null) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data || {},
        sound: content.sound || 'default',
      },
      trigger: trigger || null, // null = inmediatamente
    });
  },

  /**
   * Cancelar todas las notificaciones programadas
   */
  async cancelAllScheduledNotifications() {
    return Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Obtener el conteo de badge actual
   */
  async getBadgeCount() {
    return Notifications.getBadgeCountAsync();
  },

  /**
   * Establecer el conteo de badge
   * @param {number} count - Numero de badge
   */
  async setBadgeCount(count) {
    return Notifications.setBadgeCountAsync(count);
  },

  /**
   * Limpiar el badge
   */
  async clearBadge() {
    return Notifications.setBadgeCountAsync(0);
  },

  /**
   * Verificar si tiene permisos de notificaciones
   */
  async hasPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Solicitar permisos de notificaciones
   */
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },
};

export default pushNotificationService;
