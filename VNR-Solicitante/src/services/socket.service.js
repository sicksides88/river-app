import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

// Extraer base URL sin /api
const SOCKET_URL = (CONFIG.API_URL || 'https://vnr-api.whapy.com/api').replace(/\/api\/?$/, '');

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Registro de salas/suscripciones activas para re-emitirlas tras reconectar.
// Sin esto, al caerse y reconectar el socket (id nuevo) el servidor pierde la
// membresía de la sala y el tracking en vivo deja de actualizarse.
const rejoinActions = new Map(); // key -> { event, data }

/**
 * Servicio de Socket.IO para el frontend
 */
export const socketService = {
  /**
   * Conectar al servidor de WebSocket
   * @returns {Promise<Socket>} Socket conectado
   */
  async connect() {
    if (socket?.connected) {
      console.log('🔌 Socket ya conectado');
      return socket;
    }

    console.log('🔌 Intentando conectar socket a:', SOCKET_URL);

    try {
      // Obtener token de autenticación
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.warn('❌ No hay token para conectar socket');
        return null;
      }


      // Crear conexión
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Manejar eventos de conexión
      socket.on('connect', () => {
        console.log('✅ Socket conectado:', socket.id);
        reconnectAttempts = 0;
        // Re-emitir los joins/subscribes activos (cubre la reconexión).
        if (rejoinActions.size > 0) {
          console.log(`🔁 Re-uniéndose a ${rejoinActions.size} sala(s) tras (re)conexión`);
          for (const { event, data } of rejoinActions.values()) {
            socket.emit(event, data);
          }
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket desconectado:', reason);
      });

      socket.on('connect_error', (error) => {
        reconnectAttempts++;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('Socket: máximo de intentos alcanzado');
          socket.disconnect();
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
      });

      // Esperar conexión con timeout más largo
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // No rechazar, solo resolver sin conexión
          console.warn('Socket: timeout de conexión, continuando sin socket');
          resolve();
        }, 15000);

        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        // No rechazar en el primer error, dejar que reintente
        socket.once('connect_error', () => {
          // El socket reintentará automáticamente
        });
      });

      return socket;
    } catch (error) {
      console.error('Error conectando socket:', error);
      throw error;
    }
  },

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      rejoinActions.clear(); // no re-unirse a salas viejas tras re-login
      console.log('🔌 Socket desconectado manualmente');
    }
  },

  /**
   * Obtener instancia del socket
   * @returns {Socket | null} Socket actual
   */
  getSocket() {
    return socket;
  },

  /**
   * Verificar si está conectado
   * @returns {boolean}
   */
  isConnected() {
    return socket?.connected || false;
  },

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a enviar
   * @param {Function} callback - Callback opcional para acknowledgement
   */
  emit(event, data, callback) {
    console.log(`🔌 emit(${event}):`, { connected: socket?.connected, hasCallback: !!callback });
    if (!socket?.connected) {
      console.warn('❌ Socket no conectado. No se puede emitir:', event);
      if (callback) callback({ success: false, error: 'Socket no conectado' });
      return false;
    }
    if (callback) {
      console.log(`🔌 Emitiendo ${event} con callback`);
      socket.emit(event, data, callback);
    } else {
      console.log(`🔌 Emitiendo ${event} sin callback`);
      socket.emit(event, data);
    }
    return true;
  },

  /**
   * Emitir evento con callback (acknowledgement)
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a enviar
   * @returns {Promise<any>} Respuesta del servidor
   */
  emitWithAck(event, data) {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error('Socket no conectado'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando respuesta'));
      }, 10000);

      socket.emit(event, data, (response) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Error en respuesta'));
        }
      });
    });
  },

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback) {
    if (!socket) {
      console.warn('Socket no inicializado');
      return () => {};
    }

    socket.on(event, callback);

    // Retornar función para desuscribirse
    return () => {
      socket?.off(event, callback);
    };
  },

  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función específica (opcional)
   */
  off(event, callback) {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.removeAllListeners(event);
      }
    }
  },

  /**
   * Escuchar evento una sola vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   */
  once(event, callback) {
    socket?.once(event, callback);
  },

  // ==========================================
  // MÉTODOS ESPECÍFICOS DE VIAJES
  // ==========================================

  /**
   * Unirse a room de viaje
   * @param {string} rideId - ID del viaje
   */
  joinRide(rideId) {
    rejoinActions.set(`ride:${rideId}`, { event: 'join:ride', data: { rideId } });
    this.emit('join:ride', { rideId });
  },

  /**
   * Salir de room de viaje
   * @param {string} rideId - ID del viaje
   */
  leaveRide(rideId) {
    rejoinActions.delete(`ride:${rideId}`);
    this.emit('leave:ride', { rideId });
  },

  /**
   * Solicitar viaje
   * @param {string} rideId - ID del viaje
   */
  requestRide(rideId) {
    this.emit('ride:request', { rideId });
  },

  /**
   * Aceptar viaje (conductor)
   * @param {string} rideId - ID del viaje
   */
  acceptRide(rideId) {
    this.emit('ride:accept', { rideId });
  },

  /**
   * Marcar llegada (conductor)
   * @param {string} rideId - ID del viaje
   */
  arrivedAtPickup(rideId) {
    this.emit('ride:arrived', { rideId });
  },

  /**
   * Iniciar viaje (conductor)
   * @param {string} rideId - ID del viaje
   */
  startRide(rideId) {
    this.emit('ride:start', { rideId });
  },

  /**
   * Completar viaje (conductor)
   * @param {string} rideId - ID del viaje
   * @param {number} actualPrice - Precio final
   */
  completeRide(rideId, actualPrice) {
    this.emit('ride:complete', { rideId, actualPrice });
  },

  /**
   * Cancelar viaje
   * @param {string} rideId - ID del viaje
   * @param {string} reason - Razón de cancelación
   */
  cancelRide(rideId, reason) {
    this.emit('ride:cancel', { rideId, reason });
  },

  // ==========================================
  // MÉTODOS DE UBICACIÓN (CONDUCTOR)
  // ==========================================

  /**
   * Actualizar ubicación del conductor
   * @param {Object} location - Datos de ubicación
   */
  updateLocation(location) {
    this.emit('location:update', location);
  },

  /**
   * Suscribirse a ubicación de conductor
   * @param {string} driverId - ID del conductor
   * @param {string} rideId - ID del viaje
   */
  subscribeToDriverLocation(driverId, rideId) {
    rejoinActions.set(`loc:${rideId}`, { event: 'location:subscribe', data: { driverId, rideId } });
    this.emit('location:subscribe', { driverId, rideId });
  },

  /**
   * Cancelar suscripción a ubicación
   * @param {string} rideId - ID del viaje
   */
  unsubscribeFromDriverLocation(rideId) {
    rejoinActions.delete(`loc:${rideId}`);
    this.emit('location:unsubscribe', { rideId });
  },

  // ==========================================
  // MÉTODOS DE DISPONIBILIDAD (CONDUCTOR)
  // ==========================================

  /**
   * Ponerse online (conductor)
   * @param {Object} location - Ubicación actual
   */
  goOnline(location) {
    rejoinActions.set('driver:online', { event: 'driver:online', data: { location } });
    this.emit('driver:online', { location });
  },

  /**
   * Ponerse offline (conductor)
   */
  goOffline() {
    rejoinActions.delete('driver:online');
    this.emit('driver:offline');
  },

  /**
   * Pausar disponibilidad
   * @param {string} reason - Razón de pausa
   */
  pause(reason) {
    this.emit('driver:pause', { reason });
  },

  /**
   * Obtener estado actual
   * @returns {Promise<Object>} Estado del conductor
   */
  getDriverStatus() {
    return this.emitWithAck('driver:status', {});
  },

  // ==========================================
  // MÉTODOS DE ENVÍOS/DELIVERIES (CONDUCTOR)
  // ==========================================

  /**
   * Aceptar envío (conductor)
   * @param {string} deliveryId - ID del envío
   * @param {string} vehicleId - ID del vehículo
   */
  acceptDelivery(deliveryId, vehicleId) {
    this.emit('delivery:accept', { deliveryId, vehicleId });
  },

  /**
   * Llegada al punto de recogida
   * @param {string} deliveryId - ID del envío
   */
  arrivedAtDeliveryPickup(deliveryId) {
    this.emit('delivery:arrived_pickup', { deliveryId });
  },

  /**
   * Paquete recogido
   * @param {string} deliveryId - ID del envío
   */
  deliveryPickedUp(deliveryId) {
    this.emit('delivery:picked_up', { deliveryId });
  },

  /**
   * Envío en tránsito
   * @param {string} deliveryId - ID del envío
   */
  deliveryInTransit(deliveryId) {
    this.emit('delivery:in_transit', { deliveryId });
  },

  /**
   * Llegada al punto de entrega
   * @param {string} deliveryId - ID del envío
   */
  arrivedAtDeliveryDropoff(deliveryId) {
    this.emit('delivery:arrived_dropoff', { deliveryId });
  },

  /**
   * Envío entregado
   * @param {string} deliveryId - ID del envío
   * @param {number} actualPrice - Precio final
   */
  deliveryComplete(deliveryId, actualPrice) {
    this.emit('delivery:delivered', { deliveryId, actualPrice });
  },

  /**
   * Cancelar envío
   * @param {string} deliveryId - ID del envío
   * @param {string} reason - Razón de cancelación
   */
  cancelDelivery(deliveryId, reason) {
    this.emit('delivery:cancel', { deliveryId, reason, cancelledBy: 'driver' });
  },

  /**
   * Actualizar ubicación durante envío
   * @param {string} deliveryId - ID del envío
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   */
  updateDeliveryLocation(deliveryId, lat, lng) {
    this.emit('delivery:location_update', { deliveryId, lat, lng });
  },
};

export default socketService;
