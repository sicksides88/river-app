import { getIO } from '../config/socket.js';
import { socketAuthMiddleware } from '../middleware/socket.auth.js';
import connectionHandler from './connection.handler.js';
import rideHandler from './ride.handler.js';
import locationHandler from './location.handler.js';
import driverHandler from './driver.handler.js';
import chatHandler from './chat.handler.js';
import deliveryHandler from './delivery.handler.js';

/**
 * Inicializar todos los handlers de Socket.IO
 */
export const initSocketHandlers = () => {
  const io = getIO();

  // Aplicar middleware de autenticación
  io.use(socketAuthMiddleware);

  // Manejar nuevas conexiones
  io.on('connection', (socket) => {
    console.log(`⚡ Nueva conexión: ${socket.user?.nombre || 'Unknown'} (${socket.id})`);

    // Inicializar handlers para este socket
    connectionHandler(socket, io);
    rideHandler(socket, io);
    locationHandler(socket, io);
    driverHandler(socket, io);
    chatHandler(socket, io);
    deliveryHandler(socket, io);

    // Log de desconexión
    socket.on('disconnect', (reason) => {
      console.log(`❌ Desconexión: ${socket.user?.nombre || 'Unknown'} - ${reason}`);
    });
  });

  console.log('📡 Socket handlers inicializados');
};

export default initSocketHandlers;
