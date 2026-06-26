import { supabaseAdmin } from '../config/supabase.js';
import { getIO, emitToUser, emitToAvailableDrivers } from '../config/socket.js';
import notificationService from './notification.service.js';
import { appendCancellationToNotes } from '../utils/rideNotes.js';
import { haversineDistanceKm } from './geo.service.js';

/**
 * Configuración del sistema de cola
 */
const QUEUE_CONFIG = {
  DRIVERS_PER_ROUND: 5,        // Conductores a notificar por ronda
  ROUND_TIMEOUT_MS: 15000,     // 15 segundos por ronda
  MAX_ROUNDS: 3,               // Máximo 3 rondas por ciclo de búsqueda
  SEARCH_RADIUS_KM: 5,         // Radio inicial de búsqueda
  RADIUS_INCREMENT_KM: 2,      // Incremento de radio por ronda
  MAX_RADIUS_KM: 15,           // Radio máximo
  MAX_SEARCH_TIME_MS: 5 * 60 * 1000,  // 5 minutos de búsqueda total
  RETRY_INTERVAL_MS: 20000,    // 20 segundos entre reintentos cuando no hay conductores
};

/**
 * Cache de colas activas en memoria
 * Map<rideId, QueueState>
 */
const activeQueues = new Map();

/**
 * Estado de una cola
 * @typedef {Object} QueueState
 * @property {string} rideId
 * @property {Object} ride - Datos del viaje
 * @property {number} currentRound - Ronda actual (1-3)
 * @property {Set<string>} notifiedDrivers - IDs de conductores ya notificados
 * @property {Set<string>} rejectedDrivers - IDs de conductores que rechazaron
 * @property {NodeJS.Timeout} timeoutId - ID del timeout actual
 * @property {string} status - 'searching' | 'accepted' | 'no_drivers' | 'cancelled'
 * @property {number} searchRadius - Radio actual de búsqueda
 * @property {Date} createdAt
 */

/**
 * Servicio de Cola de Viajes
 * Maneja la asignación de conductores mediante notificaciones en rondas
 */
class RideQueueService {
  constructor() {
    this.io = null;
  }

  /**
   * Inicializar con instancia de Socket.IO
   */
  initialize() {
    this.io = getIO();
    console.log('🚗 RideQueueService initialized');
  }

  /**
   * Iniciar búsqueda de conductor para un viaje
   * @param {Object} ride - Datos del viaje
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async startSearch(ride) {
    try {
      const rideId = ride.id;

      // Verificar si ya hay una búsqueda activa para este viaje
      if (activeQueues.has(rideId)) {
        console.log(`⚠️ Queue already active for ride ${rideId}`);
        return { success: false, message: 'Ya hay una búsqueda activa para este viaje' };
      }

      // Crear estado inicial de la cola
      const queueState = {
        rideId,
        ride,
        currentRound: 0,
        notifiedDrivers: new Set(),
        rejectedDrivers: new Set(),
        timeoutId: null,
        status: 'searching',
        searchRadius: QUEUE_CONFIG.SEARCH_RADIUS_KM,
        createdAt: new Date(),
      };

      activeQueues.set(rideId, queueState);

      console.log(`🔍 Starting driver search for ride ${rideId}`);

      // Notificar al usuario que comenzó la búsqueda
      this.emitToUser(ride.user_id, 'ride:search_started', {
        rideId,
        message: 'Buscando conductores cercanos...',
      });

      // Iniciar primera ronda
      await this.startNextRound(rideId);

      return { success: true, message: 'Búsqueda iniciada' };

    } catch (error) {
      console.error('Error starting ride search:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Iniciar siguiente ronda de notificaciones
   * @param {string} rideId
   */
  async startNextRound(rideId) {
    const queue = activeQueues.get(rideId);
    if (!queue || queue.status !== 'searching') {
      return;
    }

    // Verificar si excedimos el tiempo máximo de búsqueda (5 minutos)
    const elapsedMs = Date.now() - queue.createdAt.getTime();
    if (elapsedMs >= QUEUE_CONFIG.MAX_SEARCH_TIME_MS) {
      console.log(`⏰ Search time exceeded (${Math.round(elapsedMs / 1000)}s) for ride ${rideId}`);
      await this.handleNoDriversAvailable(rideId);
      return;
    }

    // Incrementar ronda
    queue.currentRound++;

    // Si excedimos las rondas del ciclo actual, reiniciar ciclo (reset radio y notificados)
    if (queue.currentRound > QUEUE_CONFIG.MAX_ROUNDS) {
      const remainingMs = QUEUE_CONFIG.MAX_SEARCH_TIME_MS - elapsedMs;
      console.log(`🔄 All rounds exhausted for ride ${rideId}, retrying in ${QUEUE_CONFIG.RETRY_INTERVAL_MS / 1000}s (${Math.round(remainingMs / 1000)}s remaining)`);

      // Notificar al usuario que seguimos buscando
      this.emitToUser(queue.ride.user_id, 'ride:search_progress', {
        rideId,
        round: 0,
        maxRounds: QUEUE_CONFIG.MAX_ROUNDS,
        driversNotified: 0,
        message: 'Seguimos buscando conductores en tu zona...',
        retrying: true,
        elapsedSeconds: Math.round(elapsedMs / 1000),
        maxSeconds: QUEUE_CONFIG.MAX_SEARCH_TIME_MS / 1000,
      });

      // Esperar y reiniciar un nuevo ciclo de rondas
      queue.timeoutId = setTimeout(async () => {
        const currentQueue = activeQueues.get(rideId);
        if (currentQueue && currentQueue.status === 'searching') {
          // Reiniciar ciclo: reset rondas, radio y listas de conductores
          currentQueue.currentRound = 0;
          currentQueue.searchRadius = QUEUE_CONFIG.SEARCH_RADIUS_KM;
          currentQueue.notifiedDrivers.clear();
          currentQueue.rejectedDrivers.clear();
          console.log(`🔍 Restarting search cycle for ride ${rideId}`);
          await this.startNextRound(rideId);
        }
      }, QUEUE_CONFIG.RETRY_INTERVAL_MS);
      return;
    }

    console.log(`📢 Round ${queue.currentRound}/${QUEUE_CONFIG.MAX_ROUNDS} for ride ${rideId} (elapsed: ${Math.round(elapsedMs / 1000)}s)`);

    // Buscar conductores cercanos no notificados
    const drivers = await this.findAvailableDrivers(queue);

    if (drivers.length === 0) {
      // Verificar si hay conductores notificados que aún no rechazaron (esperando respuesta)
      const pendingDrivers = [...queue.notifiedDrivers].filter(
        id => !queue.rejectedDrivers.has(id)
      );

      if (pendingDrivers.length > 0) {
        // Hay conductores que aún pueden aceptar, esperar el timeout de la ronda
        console.log(`⏳ No new drivers found, but ${pendingDrivers.length} still pending. Waiting timeout...`);
        queue.timeoutId = setTimeout(async () => {
          const currentQueue = activeQueues.get(rideId);
          if (currentQueue && currentQueue.status === 'searching') {
            console.log(`⏰ Round ${queue.currentRound} timeout for ride ${rideId}`);
            await this.startNextRound(rideId);
          }
        }, QUEUE_CONFIG.ROUND_TIMEOUT_MS);
        return;
      }

      // No hay conductores pendientes ni nuevos, intentar con mayor radio
      if (queue.searchRadius < QUEUE_CONFIG.MAX_RADIUS_KM) {
        queue.searchRadius += QUEUE_CONFIG.RADIUS_INCREMENT_KM;
        console.log(`📍 Expanding search radius to ${queue.searchRadius}km`);
        await this.startNextRound(rideId);
        return;
      }

      // Radio máximo alcanzado sin conductores → esperar y reiniciar ciclo
      const remainingMs = QUEUE_CONFIG.MAX_SEARCH_TIME_MS - elapsedMs;
      if (remainingMs > QUEUE_CONFIG.RETRY_INTERVAL_MS) {
        console.log(`🔄 Max radius reached, no drivers. Retrying in ${QUEUE_CONFIG.RETRY_INTERVAL_MS / 1000}s (${Math.round(remainingMs / 1000)}s remaining)`);

        this.emitToUser(queue.ride.user_id, 'ride:search_progress', {
          rideId,
          round: queue.currentRound,
          maxRounds: QUEUE_CONFIG.MAX_ROUNDS,
          driversNotified: 0,
          message: 'Seguimos buscando conductores en tu zona...',
          retrying: true,
          elapsedSeconds: Math.round(elapsedMs / 1000),
          maxSeconds: QUEUE_CONFIG.MAX_SEARCH_TIME_MS / 1000,
        });

        queue.timeoutId = setTimeout(async () => {
          const currentQueue = activeQueues.get(rideId);
          if (currentQueue && currentQueue.status === 'searching') {
            currentQueue.currentRound = 0;
            currentQueue.searchRadius = QUEUE_CONFIG.SEARCH_RADIUS_KM;
            currentQueue.notifiedDrivers.clear();
            currentQueue.rejectedDrivers.clear();
            console.log(`🔍 Restarting search cycle for ride ${rideId}`);
            await this.startNextRound(rideId);
          }
        }, QUEUE_CONFIG.RETRY_INTERVAL_MS);
        return;
      }

      // Ya no queda tiempo suficiente para otro reintento
      await this.handleNoDriversAvailable(rideId);
      return;
    }

    // Notificar a los conductores encontrados
    await this.notifyDrivers(queue, drivers);

    // Notificar al usuario el progreso
    this.emitToUser(queue.ride.user_id, 'ride:search_progress', {
      rideId,
      round: queue.currentRound,
      maxRounds: QUEUE_CONFIG.MAX_ROUNDS,
      driversNotified: drivers.length,
      message: `Notificando a ${drivers.length} conductores...`,
    });

    // Establecer timeout para siguiente ronda
    queue.timeoutId = setTimeout(async () => {
      // Si nadie aceptó en esta ronda, pasar a la siguiente
      const currentQueue = activeQueues.get(rideId);
      if (currentQueue && currentQueue.status === 'searching') {
        console.log(`⏰ Round ${queue.currentRound} timeout for ride ${rideId}`);
        await this.startNextRound(rideId);
      }
    }, QUEUE_CONFIG.ROUND_TIMEOUT_MS);
  }

  /**
   * Calcular distancia entre dos puntos usando fórmula Haversine
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} Distancia en km
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    return haversineDistanceKm(lat1, lon1, lat2, lon2);
  }

  /**
   * Mapear service_type del viaje a driver_type del conductor
   * @param {string} serviceType
   * @returns {string}
   */
  mapServiceTypeToDriverType(serviceType) {
    const mapping = {
      'vuelta-segura': 'vuelta_segura',
      'vuelta_segura': 'vuelta_segura',
      'chofer': 'chofer',
      'flete': 'fletes',
      'fletes': 'fletes',
      'envio': 'cadete',
      'cadete': 'cadete',
      'auxilio': 'auxilio',
    };
    return mapping[serviceType] || serviceType;
  }

  /**
   * Buscar conductores disponibles para el viaje
   * @param {QueueState} queue
   * @returns {Promise<Array>}
   */
  async findAvailableDrivers(queue) {
    try {
      const { ride, notifiedDrivers, rejectedDrivers, searchRadius } = queue;

      // Mapear tipo de servicio a tipo de conductor
      const driverType = this.mapServiceTypeToDriverType(ride.service_type);
      console.log(`🔍 Buscando conductores tipo: ${driverType} para servicio: ${ride.service_type}`);
      console.log(`📍 Ubicación pickup: ${ride.pickup_lat}, ${ride.pickup_lng}, radio: ${searchRadius}km`);

      // Buscar directamente en driver_availability (más confiable que RPC)
      const { data: availableDrivers, error: availError } = await supabaseAdmin
        .from('driver_availability')
        .select(`
          driver_id,
          is_available,
          current_latitude,
          current_longitude,
          last_location_update,
          active_service_type,
          profiles:driver_id (
            id,
            nombre,
            apellido,
            avatar,
            rating_average,
            driver_status,
            is_driver
          )
        `)
        .eq('is_available', true)
        .not('current_latitude', 'is', null)
        .not('current_longitude', 'is', null);

      if (availError) {
        console.error('Error finding drivers from driver_availability:', availError);
        return [];
      }

      console.log(`📋 Conductores disponibles encontrados: ${availableDrivers?.length || 0}`);

      // Filtrar por active_service_type y calcular distancia
      const nearbyDrivers = (availableDrivers || [])
        .filter(da => {
          const profile = da.profiles;
          if (!profile) return false;
          if (!profile.is_driver) return false;
          if (profile.driver_status !== 'active') {
            console.log(`   ❌ ${profile.nombre}: status=${profile.driver_status} (no activo)`);
            return false;
          }
          if (driverType && da.active_service_type !== driverType) {
            console.log(`   ❌ ${profile.nombre}: servicio activo=${da.active_service_type} (esperado: ${driverType})`);
            return false;
          }
          return true;
        })
        .map(da => {
          const profile = da.profiles;
          const distance = this.calculateDistance(
            parseFloat(ride.pickup_lat),
            parseFloat(ride.pickup_lng),
            parseFloat(da.current_latitude),
            parseFloat(da.current_longitude)
          );
          return {
            driver_id: da.driver_id,
            nombre: profile.nombre,
            apellido: profile.apellido,
            avatar: profile.avatar,
            rating_average: profile.rating_average,
            distance_km: distance,
            active_service_type: da.active_service_type,
          };
        })
        .filter(d => d.distance_km <= searchRadius)
        .sort((a, b) => a.distance_km - b.distance_km);

      console.log(`✅ Conductores cercanos válidos: ${nearbyDrivers.length}`);
      nearbyDrivers.forEach(d => {
        console.log(`   → ${d.nombre} (${d.distance_km.toFixed(1)}km, servicio: ${d.active_service_type})`);
      });

      // Filtrar conductores ya notificados o que rechazaron
      const eligibleDrivers = (nearbyDrivers || []).filter(driver => {
        const driverId = driver.driver_id;
        return !notifiedDrivers.has(driverId) && !rejectedDrivers.has(driverId);
      });

      // Tomar solo los primeros N conductores para esta ronda
      const driversForRound = eligibleDrivers.slice(0, QUEUE_CONFIG.DRIVERS_PER_ROUND);

      // Ordenar por cercanía (ya vienen ordenados pero por si acaso)
      driversForRound.sort((a, b) => a.distance_km - b.distance_km);

      return driversForRound;

    } catch (error) {
      console.error('Error finding available drivers:', error);
      return [];
    }
  }

  /**
   * Notificar a un grupo de conductores
   * @param {QueueState} queue
   * @param {Array} drivers
   */
  async notifyDrivers(queue, drivers) {
    const { rideId, ride } = queue;

    for (const driver of drivers) {
      const driverId = driver.driver_id;

      // Marcar como notificado
      queue.notifiedDrivers.add(driverId);

      // Preparar datos del viaje para el conductor (formato compatible con frontend)
      const rideData = {
        rideId,
        serviceType: ride.service_type,
        estimatedPrice: parseFloat(ride.estimated_price) || 0,
        distance: parseFloat(ride.distance) || 0,
        duration: parseFloat(ride.duration) || 0,
        pickup: {
          address: ride.pickup_address,
          lat: parseFloat(ride.pickup_lat),
          lng: parseFloat(ride.pickup_lng),
        },
        dropoff: {
          address: ride.dropoff_address,
          lat: parseFloat(ride.dropoff_lat),
          lng: parseFloat(ride.dropoff_lng),
        },
        distanceToPickup: parseFloat(driver.distance_km) || 0,
        timeoutSeconds: QUEUE_CONFIG.ROUND_TIMEOUT_MS / 1000,
        round: queue.currentRound,
      };

      // Enviar notificación push
      try {
        await notificationService.sendToUser(driverId, {
          type: 'new_ride_available',
          title: '🚗 Nuevo viaje disponible',
          body: `Viaje a ${ride.dropoff_address?.split(',')[0] || 'destino'}. $${ride.estimated_price?.toLocaleString('es-AR') || '---'}`,
          data: {
            ...rideData,
            screen: 'TripRequest',
          },
          sound: 'new_ride.wav',
          priority: 'high',
        });
      } catch (notifError) {
        console.error(`Error sending push to driver ${driverId}:`, notifError);
      }

      // Enviar evento WebSocket
      // Verificar si el conductor tiene sockets conectados en su room
      if (this.io) {
        const room = this.io.sockets.adapter.rooms.get(`user:${driverId}`);
        const socketsInRoom = room ? room.size : 0;
        if (socketsInRoom === 0) {
          console.warn(`   ⚠️ Driver ${driver.nombre} NO tiene socket conectado (room user:${driverId} vacío)`);
        } else {
          console.log(`   🔌 Driver ${driver.nombre} tiene ${socketsInRoom} socket(s) conectado(s)`);
        }
      }
      this.emitToUser(driverId, 'ride:new_request', rideData);

      console.log(`📱 Notified driver ${driver.nombre} (${driver.distance_km?.toFixed(1)}km away)`);
    }
  }

  /**
   * Manejar cuando un conductor acepta el viaje
   * @param {string} rideId
   * @param {string} driverId
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async handleDriverAccept(rideId, driverId) {
    const queue = activeQueues.get(rideId);

    if (!queue) {
      return { success: false, message: 'No hay búsqueda activa para este viaje' };
    }

    if (queue.status !== 'searching') {
      return { success: false, message: 'El viaje ya fue asignado o cancelado' };
    }

    // Verificar que el conductor fue notificado
    if (!queue.notifiedDrivers.has(driverId)) {
      return { success: false, message: 'No fuiste notificado para este viaje' };
    }

    console.log(`✅ Driver ${driverId} accepted ride ${rideId}`);

    // Actualizar estado de la cola
    queue.status = 'accepted';

    // Cancelar timeout
    if (queue.timeoutId) {
      clearTimeout(queue.timeoutId);
    }

    // Notificar a otros conductores que el viaje ya no está disponible
    this.notifyRideTaken(queue, driverId);

    // Limpiar cola
    activeQueues.delete(rideId);

    return { success: true, message: 'Viaje aceptado correctamente' };
  }

  /**
   * Manejar cuando un conductor rechaza el viaje
   * @param {string} rideId
   * @param {string} driverId
   */
  async handleDriverReject(rideId, driverId) {
    const queue = activeQueues.get(rideId);

    if (!queue || queue.status !== 'searching') {
      return;
    }

    // Marcar conductor como rechazado
    queue.rejectedDrivers.add(driverId);

    console.log(`❌ Driver ${driverId} rejected ride ${rideId}`);

    // Si todos los conductores de la ronda actual rechazaron, avanzar a siguiente ronda
    const activeNotified = [...queue.notifiedDrivers].filter(
      id => !queue.rejectedDrivers.has(id)
    );

    if (activeNotified.length === 0) {
      // Cancelar timeout actual
      if (queue.timeoutId) {
        clearTimeout(queue.timeoutId);
      }
      // Iniciar siguiente ronda inmediatamente
      await this.startNextRound(rideId);
    }
  }

  /**
   * Notificar a conductores que el viaje ya fue tomado
   * @param {QueueState} queue
   * @param {string} acceptedDriverId
   */
  notifyRideTaken(queue, acceptedDriverId) {
    const { rideId, notifiedDrivers } = queue;

    for (const driverId of notifiedDrivers) {
      if (driverId !== acceptedDriverId) {
        this.emitToUser(driverId, 'ride:taken', {
          rideId,
          message: 'Este viaje ya fue aceptado por otro conductor',
        });
      }
    }
  }

  /**
   * Manejar cuando no hay conductores disponibles
   * @param {string} rideId
   */
  async handleNoDriversAvailable(rideId) {
    const queue = activeQueues.get(rideId);

    if (!queue) return;

    console.log(`😞 No drivers available for ride ${rideId}`);

    queue.status = 'no_drivers';

    // Cancelar timeout
    if (queue.timeoutId) {
      clearTimeout(queue.timeoutId);
    }

    // Notificar al usuario
    this.emitToUser(queue.ride.user_id, 'ride:no_drivers', {
      rideId,
      message: 'No encontramos conductores disponibles en este momento. Intenta de nuevo en unos minutos.',
    });

    // Enviar push al usuario
    try {
      await notificationService.sendToUser(queue.ride.user_id, {
        type: 'no_drivers_available',
        title: 'Sin conductores disponibles',
        body: 'No encontramos conductores en tu zona. Intenta de nuevo en unos minutos.',
        data: { rideId, screen: 'Home' },
      });
    } catch (error) {
      console.error('Error sending no_drivers notification:', error);
    }

    // Actualizar estado del viaje en BD
    try {
      const { data: existingRide } = await supabaseAdmin
        .from('rides')
        .select('notes')
        .eq('id', rideId)
        .single();

      await supabaseAdmin
        .from('rides')
        .update({
          status: 'cancelled',
          notes: appendCancellationToNotes(
            existingRide?.notes || queue.ride?.notes,
            'no_drivers_available'
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId);
    } catch (error) {
      console.error('Error updating ride status:', error);
    }

    // Limpiar cola
    activeQueues.delete(rideId);
  }

  /**
   * Cancelar búsqueda de conductor
   * @param {string} rideId
   * @param {string} reason
   */
  async cancelSearch(rideId, reason = 'user_cancelled') {
    const queue = activeQueues.get(rideId);

    if (!queue) {
      return { success: false, message: 'No hay búsqueda activa' };
    }

    console.log(`🚫 Search cancelled for ride ${rideId}: ${reason}`);

    queue.status = 'cancelled';

    // Cancelar timeout
    if (queue.timeoutId) {
      clearTimeout(queue.timeoutId);
    }

    // Notificar a conductores notificados que el viaje fue cancelado
    for (const driverId of queue.notifiedDrivers) {
      this.emitToUser(driverId, 'ride:cancelled', {
        rideId,
        message: 'El viaje fue cancelado',
      });
    }

    // Limpiar cola
    activeQueues.delete(rideId);

    return { success: true, message: 'Búsqueda cancelada' };
  }

  /**
   * Obtener estado de la cola para un viaje
   * @param {string} rideId
   * @returns {Object|null}
   */
  getQueueStatus(rideId) {
    const queue = activeQueues.get(rideId);

    if (!queue) return null;

    return {
      rideId,
      status: queue.status,
      currentRound: queue.currentRound,
      maxRounds: QUEUE_CONFIG.MAX_ROUNDS,
      driversNotified: queue.notifiedDrivers.size,
      driversRejected: queue.rejectedDrivers.size,
      searchRadius: queue.searchRadius,
      createdAt: queue.createdAt,
    };
  }

  /**
   * Helper para emitir a usuario
   * @param {string} userId
   * @param {string} event
   * @param {Object} data
   */
  emitToUser(userId, event, data) {
    try {
      if (this.io) {
        this.io.to(`user:${userId}`).emit(event, data);
      }
    } catch (error) {
      console.error(`Error emitting ${event} to user ${userId}:`, error);
    }
  }

  /**
   * Limpiar colas antiguas (llamar periódicamente)
   */
  cleanupStaleQueues() {
    const now = Date.now();
    const MAX_AGE_MS = QUEUE_CONFIG.MAX_SEARCH_TIME_MS + 60000; // Tiempo máximo de búsqueda + 1 minuto de gracia

    for (const [rideId, queue] of activeQueues) {
      const age = now - queue.createdAt.getTime();
      if (age > MAX_AGE_MS) {
        console.log(`🧹 Cleaning up stale queue for ride ${rideId}`);
        this.cancelSearch(rideId, 'timeout');
      }
    }
  }
}

// Singleton
const rideQueueService = new RideQueueService();

// Limpiar colas antiguas cada minuto
setInterval(() => {
  rideQueueService.cleanupStaleQueues();
}, 60000);

export default rideQueueService;
