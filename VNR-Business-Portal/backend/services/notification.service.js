import { supabase, supabaseAdmin } from '../config/supabase.js';
import { notificationPreferencesService } from './notificationPreferences.service.js';
import { emitToUser } from '../config/socket.js';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

/**
 * Servicio de Notificaciones Push
 * Maneja el envio de notificaciones via Expo Push Service
 */
class NotificationService {
  constructor() {
    // Expo Push Service no requiere configuración adicional
    this.isConfigured = true;
  }

  /**
   * Verificar si un token es válido de Expo
   */
  isExpoPushToken(token) {
    return typeof token === 'string' && token.startsWith('ExponentPushToken[');
  }

  /**
   * Enviar notificaciones via Expo Push Service
   * @param {Array} messages - Array de mensajes en formato Expo
   */
  async sendExpoPushNotifications(messages) {
    if (!messages || messages.length === 0) {
      return { success: true, results: [] };
    }

    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Expo Push error:', result);
        return { success: false, error: result };
      }

      return { success: true, results: result.data || [] };
    } catch (error) {
      console.error('Error sending Expo push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // GESTION DE TOKENS
  // ==========================================

  /**
   * Registrar token de push para un usuario
   */
  async registerToken(userId, token, deviceInfo = {}) {
    try {
      const { platform, deviceId, deviceName, appVersion } = deviceInfo;

      const { data, error } = await supabaseAdmin
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          platform: platform || 'android',
          device_id: deviceId,
          device_name: deviceName,
          app_version: appVersion,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, token: data };
    } catch (error) {
      console.error('Error registering push token:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Eliminar token de push
   */
  async removeToken(userId, token) {
    try {
      const { error } = await supabaseAdmin
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing push token:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Desactivar todos los tokens de un usuario (al cerrar sesion)
   */
  async deactivateUserTokens(userId) {
    try {
      const { error } = await supabaseAdmin
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deactivating tokens:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener tokens activos de un usuario
   */
  async getUserTokens(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('push_tokens')
        .select('token, platform')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return { success: true, tokens: data || [] };
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return { success: false, tokens: [] };
    }
  }

  // ==========================================
  // ENVIO DE NOTIFICACIONES
  // ==========================================

  /**
   * Enviar notificacion a un usuario especifico
   * Respeta las preferencias del usuario (quiet hours, categorías habilitadas)
   */
  async sendToUser(userId, notification, options = {}) {
    try {
      const { skipPreferenceCheck = false } = options;

      // Verificar preferencias del usuario (a menos que se indique lo contrario)
      if (!skipPreferenceCheck) {
        const preferenceCheck = await notificationPreferencesService.isNotificationEnabled(
          userId,
          notification.type
        );

        if (!preferenceCheck.enabled) {
          console.log(`Notification blocked for user ${userId}: ${preferenceCheck.reason}`);
          // Guardar en BD pero no enviar push
          await this.saveNotification(userId, notification, { sentPush: false, blockedReason: preferenceCheck.reason });
          return {
            success: true,
            sent: 0,
            blocked: true,
            reason: preferenceCheck.reason,
          };
        }
      }

      // Obtener tokens del usuario
      const { tokens } = await this.getUserTokens(userId);

      if (tokens.length === 0) {
        console.log(`No tokens found for user ${userId}`);
        // Guardar notificación aunque no se envíe push
        await this.saveNotification(userId, notification, { sentPush: false, blockedReason: 'no_tokens' });
        return { success: true, sent: 0 };
      }

      // Guardar notificacion en BD
      await this.saveNotification(userId, notification, { sentPush: true });

      // Emitir via WebSocket para notificaciones locales (desarrollo)
      emitToUser(userId, 'notification:new', {
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        timestamp: new Date().toISOString(),
      });

      // Obtener configuración de sonido/vibración
      const soundSettings = await notificationPreferencesService.getSoundVibrationSettings(userId);

      // Filtrar solo tokens válidos de Expo
      const validTokens = tokens.filter(t => this.isExpoPushToken(t.token));

      if (validTokens.length === 0) {
        console.log(`No valid Expo tokens found for user ${userId}`);
        return { success: true, sent: 0 };
      }

      // Preparar mensajes para Expo Push
      const messages = validTokens.map(t => this.buildExpoMessage(t.token, notification, soundSettings));

      // Enviar via Expo Push Service
      const response = await this.sendExpoPushNotifications(messages);

      // Manejar tokens inválidos
      let successCount = 0;
      let failureCount = 0;

      if (response.success && response.results) {
        response.results.forEach((result, idx) => {
          if (result.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            // Si el token es inválido, eliminarlo
            if (result.details?.error === 'DeviceNotRegistered') {
              this.removeToken(userId, validTokens[idx].token);
            }
          }
        });
      }

      console.log(`📱 Push sent to user ${userId}: ${successCount} success, ${failureCount} failed`);

      // Log detallado si hay fallos
      if (failureCount > 0 && response.results) {
        response.results.forEach((result, idx) => {
          if (result.status !== 'ok') {
            console.log(`📱 Push error for token ${validTokens[idx]?.token?.substring(0, 30)}...: ${result.message || result.details?.error || 'Unknown error'}`);
          }
        });
      }

      return {
        success: true,
        sent: successCount,
        failed: failureCount,
      };
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Enviar notificacion a multiples usuarios
   */
  async sendToMultipleUsers(userIds, notification) {
    const results = await Promise.all(
      userIds.map(userId => this.sendToUser(userId, notification))
    );

    const totalSent = results.reduce((acc, r) => acc + (r.sent || 0), 0);
    const totalFailed = results.reduce((acc, r) => acc + (r.failed || 0), 0);

    return {
      success: true,
      sent: totalSent,
      failed: totalFailed,
    };
  }

  /**
   * Enviar notificacion a un topic (broadcast)
   * Nota: Expo no soporta topics nativamente, se debe enviar a usuarios específicos
   */
  async sendToTopic(topic, notification) {
    console.log(`Topic notifications not supported with Expo Push. Topic: ${topic}`);
    return { success: false, message: 'Topics not supported with Expo Push' };
  }

  /**
   * Construir mensaje para Expo Push Service
   * @param {string} token - Expo Push Token
   * @param {Object} notification - Datos de la notificación
   * @param {Object} soundSettings - Configuración de sonido/vibración del usuario
   */
  buildExpoMessage(token, notification, soundSettings = { sound: true, vibration: true }) {
    const { type, title, body, data = {}, sound, priority } = notification;

    // Determinar si incluir sonido basado en preferencias
    const shouldPlaySound = soundSettings.sound !== false;

    return {
      to: token,
      title,
      body,
      data: {
        type: type || 'general',
        ...data,
      },
      sound: shouldPlaySound ? (sound || 'default') : null,
      priority: priority || 'high',
      channelId: 'vnr_notifications',
    };
  }

  // ==========================================
  // GESTION DE NOTIFICACIONES EN BD
  // ==========================================

  /**
   * Guardar notificacion en la base de datos
   * @param {string} userId - ID del usuario
   * @param {Object} notification - Datos de la notificación
   * @param {Object} options - Opciones adicionales (sentPush, blockedReason)
   */
  async saveNotification(userId, notification, options = {}) {
    try {
      const { type, title, body, data = {}, imageUrl } = notification;
      const { sentPush = true, blockedReason = null } = options;

      const { data: saved, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: type || 'general',
          title,
          body,
          data: {
            ...data,
            _meta: {
              sentPush,
              blockedReason,
            },
          },
          image_url: imageUrl,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, notification: saved };
    } catch (error) {
      console.error('Error saving notification:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener notificaciones de un usuario (paginado)
   */
  async getNotifications(userId, { page = 1, limit = 20 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        notifications: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, notifications: [] };
    }
  }

  /**
   * Obtener conteo de notificaciones no leidas
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Marcar notificacion como leida
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, notification: data };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Marcar todas las notificaciones como leidas
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Eliminar notificacion
   */
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ==========================================
  // NOTIFICACIONES ESPECIFICAS DE LA APP
  // ==========================================

  /**
   * Notificacion: Viaje aceptado por conductor
   */
  async sendRideAccepted(ride, driver) {
    const notification = {
      type: 'ride_accepted',
      title: 'Viaje confirmado!',
      body: `${driver.nombre} esta en camino. Llegara en ${ride.eta || 5} minutos.`,
      data: {
        rideId: ride.id,
        driverId: driver.id,
        screen: 'RideTracking',
        eta: ride.eta || 5,
      },
      imageUrl: driver.foto_url,
    };

    return this.sendToUser(ride.user_id, notification);
  }

  /**
   * Notificacion: Conductor cerca del punto de recogida
   */
  async sendDriverNearby(ride, driver) {
    const notification = {
      type: 'driver_nearby',
      title: 'Tu conductor esta llegando',
      body: `${driver.nombre} esta a menos de 1 minuto. Preparate!`,
      data: {
        rideId: ride.id,
        screen: 'RideTracking',
      },
      sound: 'arrival.wav',
    };

    return this.sendToUser(ride.user_id, notification);
  }

  /**
   * Notificacion: Conductor llego al punto de recogida
   */
  async sendDriverArrived(ride, driver) {
    const notification = {
      type: 'driver_arrived',
      title: 'Tu conductor ha llegado',
      body: `${driver.nombre} te esta esperando. Vehiculo: ${driver.vehiculo?.modelo} - ${driver.vehiculo?.patente}`,
      data: {
        rideId: ride.id,
        screen: 'RideTracking',
      },
      sound: 'arrival.wav',
    };

    return this.sendToUser(ride.user_id, notification);
  }

  /**
   * Notificacion: Viaje completado
   */
  async sendRideCompleted(ride, amount) {
    const notification = {
      type: 'ride_completed',
      title: 'Viaje completado',
      body: `Gracias por viajar con VNR. Total: $${amount}`,
      data: {
        rideId: ride.id,
        screen: 'RideReceipt',
        amount,
      },
    };

    return this.sendToUser(ride.user_id, notification);
  }

  /**
   * Notificacion: Nuevo viaje disponible (para conductores)
   */
  async sendNewRideAvailable(ride, driverIds) {
    const notification = {
      type: 'new_ride_available',
      title: 'Nuevo viaje disponible',
      body: `Viaje a ${ride.destino_direccion?.split(',')[0]}. $${ride.precio_estimado}`,
      data: {
        rideId: ride.id,
        screen: 'TripRequest',
        pickupAddress: ride.origen_direccion,
        dropoffAddress: ride.destino_direccion,
        estimatedPrice: ride.precio_estimado,
      },
      sound: 'new_ride.wav',
      priority: 'high',
    };

    return this.sendToMultipleUsers(driverIds, notification);
  }

  /**
   * Notificacion: Viaje cancelado
   */
  async sendRideCancelled(ride, cancelledBy, reason) {
    const isDriver = cancelledBy === 'driver';
    const recipientId = isDriver ? ride.user_id : ride.driver_id;

    const notification = {
      type: 'ride_cancelled',
      title: 'Viaje cancelado',
      body: isDriver
        ? 'El conductor cancelo el viaje. Buscaremos otro conductor.'
        : `El pasajero cancelo el viaje.${reason ? ` Motivo: ${reason}` : ''}`,
      data: {
        rideId: ride.id,
        cancelledBy,
        reason,
      },
    };

    return this.sendToUser(recipientId, notification);
  }

  /**
   * Notificacion: Nuevo mensaje de chat
   */
  async sendNewMessage(recipientId, senderName, message, rideId) {
    const notification = {
      type: 'new_message',
      title: senderName,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      data: {
        rideId,
        screen: 'Chat',
      },
    };

    return this.sendToUser(recipientId, notification);
  }

  /**
   * Notificacion: Pago recibido (conductor)
   */
  async sendPaymentReceived(driverId, amount, rideId) {
    const notification = {
      type: 'payment_received',
      title: 'Pago recibido',
      body: `Recibiste $${amount} por tu viaje. Estara disponible en 72hs.`,
      data: {
        rideId,
        amount,
        screen: 'DriverWallet',
      },
    };

    return this.sendToUser(driverId, notification);
  }

  /**
   * Notificacion: Ganancias disponibles para retiro
   */
  async sendEarningsAvailable(driverId, amount) {
    const notification = {
      type: 'earning_available',
      title: 'Ganancias disponibles',
      body: `Tienes $${amount} disponibles para retirar.`,
      data: {
        screen: 'DriverWallet',
        amount,
      },
    };

    return this.sendToUser(driverId, notification);
  }

  /**
   * Notificacion: Recordatorio para calificar
   */
  async sendRatingReminder(userId, rideId, driverName) {
    const notification = {
      type: 'rating_reminder',
      title: 'Califica tu viaje',
      body: `Como estuvo tu viaje con ${driverName}? Tu opinion nos ayuda a mejorar.`,
      data: {
        rideId,
        screen: 'RateRide',
      },
    };

    return this.sendToUser(userId, notification);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
