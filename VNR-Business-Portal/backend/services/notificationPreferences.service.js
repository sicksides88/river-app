import { supabaseAdmin } from '../config/supabase.js';

/**
 * Servicio de Preferencias de Notificaciones
 * Maneja la configuración personal de notificaciones de cada usuario
 */
class NotificationPreferencesService {
  // Tipos de notificación y su mapeo a preferencias
  static NOTIFICATION_TYPE_MAP = {
    ride_accepted: 'ride_updates',
    ride_started: 'ride_updates',
    ride_completed: 'ride_updates',
    ride_cancelled: 'ride_updates',
    driver_nearby: 'driver_nearby',
    driver_arrived: 'driver_nearby',
    new_ride_available: 'ride_updates',
    payment_received: 'payment_updates',
    payment_failed: 'payment_updates',
    wallet_deposit: 'payment_updates',
    wallet_withdrawal: 'payment_updates',
    earning_available: 'payment_updates',
    new_message: 'chat_messages',
    rating_reminder: 'rating_reminders',
    promo_offer: 'promotions',
    weekly_summary: 'weekly_summary',
    system_alert: null, // Siempre se envía
  };

  /**
   * Obtener preferencias del usuario
   * Crea preferencias por defecto si no existen
   */
  async getPreferences(userId) {
    try {
      let { data, error } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No existe, crear preferencias por defecto
        const createResult = await this.createDefaultPreferences(userId);
        if (createResult.success) {
          data = createResult.preferences;
        } else {
          throw new Error(createResult.message);
        }
      } else if (error) {
        throw error;
      }

      return { success: true, preferences: data };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Crear preferencias por defecto
   */
  async createDefaultPreferences(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notification_preferences')
        .insert({
          user_id: userId,
          ride_updates: true,
          driver_nearby: true,
          promotions: true,
          payment_updates: true,
          chat_messages: true,
          rating_reminders: true,
          weekly_summary: false,
          sound_enabled: true,
          vibration_enabled: true,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, preferences: data };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Actualizar preferencias
   */
  async updatePreferences(userId, updates) {
    try {
      // Validar campos permitidos
      const allowedFields = [
        'ride_updates',
        'driver_nearby',
        'promotions',
        'payment_updates',
        'chat_messages',
        'rating_reminders',
        'weekly_summary',
        'sound_enabled',
        'vibration_enabled',
        'quiet_hours_enabled',
        'quiet_hours_start',
        'quiet_hours_end',
      ];

      const filteredUpdates = {};
      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        return { success: false, message: 'No hay campos válidos para actualizar' };
      }

      // Validar formato de hora si se actualiza quiet hours
      if (filteredUpdates.quiet_hours_start) {
        if (!this.isValidTimeFormat(filteredUpdates.quiet_hours_start)) {
          return { success: false, message: 'Formato de hora inicio inválido (HH:MM)' };
        }
      }
      if (filteredUpdates.quiet_hours_end) {
        if (!this.isValidTimeFormat(filteredUpdates.quiet_hours_end)) {
          return { success: false, message: 'Formato de hora fin inválido (HH:MM)' };
        }
      }

      const { data, error } = await supabaseAdmin
        .from('notification_preferences')
        .update(filteredUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        // Si no existe el registro, crear uno con los updates
        if (error.code === 'PGRST116') {
          return this.createDefaultPreferences(userId);
        }
        throw error;
      }

      return { success: true, preferences: data };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Activar/desactivar una categoría de notificaciones
   */
  async toggleCategory(userId, category, enabled) {
    const validCategories = [
      'ride_updates',
      'driver_nearby',
      'promotions',
      'payment_updates',
      'chat_messages',
      'rating_reminders',
      'weekly_summary',
    ];

    if (!validCategories.includes(category)) {
      return { success: false, message: 'Categoría inválida' };
    }

    return this.updatePreferences(userId, { [category]: enabled });
  }

  /**
   * Configurar quiet hours
   */
  async setQuietHours(userId, enabled, startTime = null, endTime = null) {
    const updates = { quiet_hours_enabled: enabled };

    if (startTime) updates.quiet_hours_start = startTime;
    if (endTime) updates.quiet_hours_end = endTime;

    return this.updatePreferences(userId, updates);
  }

  /**
   * Verificar si un tipo de notificación está habilitado para el usuario
   */
  async isNotificationEnabled(userId, notificationType) {
    try {
      // Alertas del sistema siempre se envían
      if (notificationType === 'system_alert') {
        return { enabled: true, reason: 'system_alert' };
      }

      const { success, preferences } = await this.getPreferences(userId);

      if (!success || !preferences) {
        // Si no hay preferencias, asumir habilitado
        return { enabled: true, reason: 'no_preferences' };
      }

      // Verificar quiet hours
      if (preferences.quiet_hours_enabled) {
        const isQuietTime = this.isWithinQuietHours(
          preferences.quiet_hours_start,
          preferences.quiet_hours_end
        );

        if (isQuietTime) {
          // En quiet hours, solo alertas del sistema
          return { enabled: false, reason: 'quiet_hours' };
        }
      }

      // Verificar preferencia de categoría
      const preferenceKey = NotificationPreferencesService.NOTIFICATION_TYPE_MAP[notificationType];

      if (!preferenceKey) {
        // Tipo no mapeado, enviar por defecto
        return { enabled: true, reason: 'unmapped_type' };
      }

      const isEnabled = preferences[preferenceKey] !== false;

      return {
        enabled: isEnabled,
        reason: isEnabled ? 'preference_enabled' : 'preference_disabled',
        preference: preferenceKey,
      };
    } catch (error) {
      console.error('Error checking notification enabled:', error);
      // En caso de error, enviar la notificación
      return { enabled: true, reason: 'error_fallback' };
    }
  }

  /**
   * Verificar si estamos dentro de las quiet hours
   */
  isWithinQuietHours(startTime, endTime) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;

    // Caso: quiet hours cruzan la medianoche (ej: 22:00 - 08:00)
    if (startTimeMinutes > endTimeMinutes) {
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
    }

    // Caso normal (ej: 14:00 - 16:00)
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  }

  /**
   * Validar formato de hora HH:MM
   */
  isValidTimeFormat(time) {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  /**
   * Obtener configuración de sonido/vibración
   */
  async getSoundVibrationSettings(userId) {
    try {
      const { success, preferences } = await this.getPreferences(userId);

      if (!success || !preferences) {
        return {
          success: true,
          sound: true,
          vibration: true,
        };
      }

      return {
        success: true,
        sound: preferences.sound_enabled,
        vibration: preferences.vibration_enabled,
      };
    } catch (error) {
      console.error('Error getting sound/vibration settings:', error);
      return { success: false, sound: true, vibration: true };
    }
  }

  /**
   * Restablecer preferencias a valores por defecto
   */
  async resetToDefaults(userId) {
    try {
      // Eliminar preferencias existentes
      await supabaseAdmin
        .from('notification_preferences')
        .delete()
        .eq('user_id', userId);

      // Crear nuevas preferencias por defecto
      return this.createDefaultPreferences(userId);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtener resumen de preferencias para UI
   */
  async getPreferencesSummary(userId) {
    try {
      const { success, preferences } = await this.getPreferences(userId);

      if (!success) {
        return { success: false, message: 'No se pudieron obtener las preferencias' };
      }

      const categories = [
        {
          id: 'ride_updates',
          label: 'Actualizaciones de viaje',
          description: 'Notificaciones sobre el estado de tus viajes',
          enabled: preferences.ride_updates,
          icon: 'car',
        },
        {
          id: 'driver_nearby',
          label: 'Conductor cercano',
          description: 'Aviso cuando el conductor está llegando',
          enabled: preferences.driver_nearby,
          icon: 'location',
        },
        {
          id: 'payment_updates',
          label: 'Pagos',
          description: 'Confirmaciones de pago y movimientos',
          enabled: preferences.payment_updates,
          icon: 'card',
        },
        {
          id: 'chat_messages',
          label: 'Mensajes',
          description: 'Notificaciones de chat con conductores',
          enabled: preferences.chat_messages,
          icon: 'chatbubble',
        },
        {
          id: 'rating_reminders',
          label: 'Calificaciones',
          description: 'Recordatorios para calificar viajes',
          enabled: preferences.rating_reminders,
          icon: 'star',
        },
        {
          id: 'promotions',
          label: 'Promociones',
          description: 'Ofertas y descuentos especiales',
          enabled: preferences.promotions,
          icon: 'pricetag',
        },
        {
          id: 'weekly_summary',
          label: 'Resumen semanal',
          description: 'Resumen de tu actividad cada semana',
          enabled: preferences.weekly_summary,
          icon: 'calendar',
        },
      ];

      return {
        success: true,
        categories,
        soundEnabled: preferences.sound_enabled,
        vibrationEnabled: preferences.vibration_enabled,
        quietHours: {
          enabled: preferences.quiet_hours_enabled,
          start: preferences.quiet_hours_start,
          end: preferences.quiet_hours_end,
        },
      };
    } catch (error) {
      console.error('Error getting preferences summary:', error);
      return { success: false, message: error.message };
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
export default notificationPreferencesService;
