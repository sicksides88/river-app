import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import driverService from './driver.service';

/**
 * driverPresence.service
 *
 * Mantiene al chofer "conectado/disponible" incluso con la app en segundo plano.
 *
 * Cómo funciona:
 * - Un task de ubicación en background (expo-task-manager) mantiene la app viva
 *   mientras está conectado. En cada actualización de ubicación re-confirma la
 *   disponibilidad en el server (updateAvailability) para que no "se caiga".
 * - El estado de presencia se persiste en AsyncStorage, así al reabrir la app
 *   NO vuelve a pedir conectarse: se restaura solo.
 * - Programa un recordatorio local cada hora ("Seguís conectado").
 *
 * IMPORTANTE: el background location solo funciona en un build de EAS
 * (dev/producción), NO en Expo Go. La parte de persistencia y notificaciones
 * sí funciona en cualquier caso.
 */

export const BACKGROUND_LOCATION_TASK = 'vnr-driver-bg-location';

const PRESENCE_KEY = 'driverPresence'; // { isActive, serviceType, vehicleId }
const REMINDER_ID_KEY = 'driverConnectedReminderId';

// ─────────────────────────────────────────────────────────────────────────────
// Background task: se ejecuta aunque la app esté minimizada/cerrada.
// Debe estar definido a nivel de módulo y registrarse al iniciar la app.
// ─────────────────────────────────────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[bg-location] error:', error.message);
    return;
  }
  const locations = data?.locations;
  if (!locations || locations.length === 0) return;

  const { latitude, longitude } = locations[locations.length - 1].coords;

  try {
    const raw = await AsyncStorage.getItem(PRESENCE_KEY);
    const presence = raw ? JSON.parse(raw) : null;
    // Si ya no está activo, no re-confirmar (el stop puede tardar en aplicar).
    if (!presence?.isActive) return;

    await driverService.updateAvailability(
      true,
      latitude,
      longitude,
      presence.vehicleId,
      presence.serviceType
    );
  } catch (e) {
    // Silencioso: si falla un ping, el próximo lo reintenta.
  }
});

export const driverPresence = {
  // ── Persistencia del estado de conexión ──────────────────────────────────
  async save(presence) {
    await AsyncStorage.setItem(PRESENCE_KEY, JSON.stringify(presence));
  },
  async load() {
    const raw = await AsyncStorage.getItem(PRESENCE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async clear() {
    await AsyncStorage.removeItem(PRESENCE_KEY);
  },

  // ── Background location ───────────────────────────────────────────────────
  async startBackgroundUpdates() {
    try {
      // Necesita permiso "Always" (siempre) para correr en background.
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[bg-location] permiso background no concedido');
        return false;
      }

      const already = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      ).catch(() => false);
      if (already) return true;

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        distanceInterval: 50,
        showsBackgroundLocationIndicator: true, // iOS: barra azul
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        // Android: notificación persistente (foreground service) requerida
        foregroundService: {
          notificationTitle: 'VNR Chofer — conectado',
          notificationBody: 'Estás disponible para recibir pedidos.',
          notificationColor: '#1D4ED8',
        },
      });
      return true;
    } catch (e) {
      console.warn('[bg-location] no se pudo iniciar:', e.message);
      return false;
    }
  },

  async stopBackgroundUpdates() {
    try {
      const already = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      ).catch(() => false);
      if (already) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (e) {
      // ignore
    }
  },

  // ── Recordatorio cada hora ────────────────────────────────────────────────
  async scheduleHourlyReminder() {
    await this.cancelHourlyReminder();
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Seguís conectado como chofer',
          body: 'Estás disponible para recibir pedidos. Tocá para abrir o desconectarte.',
          data: { type: 'driver_connected_reminder' },
          sound: 'default',
        },
        trigger: { seconds: 3600, repeats: true },
      });
      await AsyncStorage.setItem(REMINDER_ID_KEY, id);
    } catch (e) {
      console.warn('[reminder] no se pudo programar:', e.message);
    }
  },

  async cancelHourlyReminder() {
    try {
      const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
      if (id) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
        await AsyncStorage.removeItem(REMINDER_ID_KEY);
      }
    } catch (e) {
      // ignore
    }
  },

  // ── Alerta inmediata de nuevo pedido (cuando la app está en background) ────
  async notifyNewOrder({ title, body, data } = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Nuevo pedido disponible',
          body: body || 'Tenés un nuevo pedido. Tocá para verlo.',
          data: data || { type: 'driver_new_order' },
          sound: 'default',
        },
        trigger: null, // inmediata
      });
    } catch (e) {
      console.warn('[new-order] no se pudo notificar:', e.message);
    }
  },

  // ── Arranca/para todo junto ───────────────────────────────────────────────
  async start({ serviceType, vehicleId }) {
    await this.save({ isActive: true, serviceType, vehicleId });
    await this.startBackgroundUpdates();
    await this.scheduleHourlyReminder();
  },

  async stop() {
    await this.clear();
    await this.stopBackgroundUpdates();
    await this.cancelHourlyReminder();
  },
};

export default driverPresence;
