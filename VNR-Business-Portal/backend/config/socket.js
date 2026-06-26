import { Server } from 'socket.io';

let io = null;

/**
 * Inicializar Socket.IO con el servidor HTTP
 * @param {http.Server} server - Servidor HTTP de Express
 * @returns {Server} Instancia de Socket.IO
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // Permitir conexiones de React Native (origin null) y web
      origin: (origin, callback) => {
        // React Native apps tienen origin null o undefined
        // Permitir todas las conexiones por ahora (la auth por token es suficiente)
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000, // Tiempo antes de considerar conexión muerta
    pingInterval: 25000, // Intervalo de ping para mantener conexión
    transports: ['websocket', 'polling'], // Priorizar WebSocket
  });

  // Log de intentos de conexión (antes de autenticación)
  io.engine.on('connection_error', (err) => {
    console.log('❌ Socket connection_error:', err.code, err.message, err.context);
  });

  console.log('🔌 Socket.IO inicializado');

  return io;
};

/**
 * Obtener instancia de Socket.IO
 * @returns {Server} Instancia de Socket.IO
 * @throws {Error} Si Socket.IO no está inicializado
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO no está inicializado. Llama a initSocket() primero.');
  }
  return io;
};

/**
 * Emitir evento a un usuario específico
 * @param {string} userId - ID del usuario
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emitir evento a un conductor específico
 * @param {string} driverId - ID del conductor
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
export const emitToDriver = (driverId, event, data) => {
  if (!io) return;
  io.to(`driver:${driverId}`).emit(event, data);
};

/**
 * Emitir evento a todos los participantes de un viaje
 * @param {string} rideId - ID del viaje
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
export const emitToRide = (rideId, event, data) => {
  if (!io) return;
  io.to(`ride:${rideId}`).emit(event, data);
};

/**
 * Emitir evento a todos los conductores disponibles
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
export const emitToAvailableDrivers = (event, data) => {
  if (!io) return;
  io.to('drivers:available').emit(event, data);
};

/**
 * Emitir evento a conductores en una zona específica
 * @param {string} zone - Identificador de zona
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
export const emitToZone = (zone, event, data) => {
  if (!io) return;
  io.to(`zone:${zone}`).emit(event, data);
};

export default {
  initSocket,
  getIO,
  emitToUser,
  emitToDriver,
  emitToRide,
  emitToAvailableDrivers,
  emitToZone,
};
