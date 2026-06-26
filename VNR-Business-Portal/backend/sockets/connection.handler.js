/**
 * Handler de conexiones y rooms
 * Maneja la unión automática a rooms según el rol del usuario
 */
const connectionHandler = (socket, io) => {
  const user = socket.user;

  if (!user) return;

  // ==========================================
  // AUTO-JOIN A ROOMS SEGÚN ROL
  // ==========================================

  // Todos los usuarios se unen a su room personal
  socket.join(`user:${user.id}`);
  console.log(`   → Joined room: user:${user.id}`);

  // Si es conductor, unirse a rooms de conductor
  // Verificar tanto role === 'driver' como is_driver === true
  if (user.role === 'driver' || user.is_driver === true) {
    socket.join(`driver:${user.id}`);
    console.log(`   → Joined room: driver:${user.id} (is_driver: ${user.is_driver})`);

    // Por defecto, conductores no están disponibles hasta que lo activen
    // La disponibilidad se maneja en driver.handler.js
  }

  // Si es admin, unirse a room de admins
  if (user.role === 'admin') {
    socket.join('admins');
    console.log(`   → Joined room: admins`);
  }

  // ==========================================
  // EVENTOS DE ROOMS
  // ==========================================

  /**
   * Unirse a un room de viaje específico
   * Evento: join:ride
   * Data: { rideId: string }
   */
  socket.on('join:ride', ({ rideId }) => {
    if (!rideId) return;

    socket.join(`ride:${rideId}`);
    console.log(`   → ${user.nombre} joined ride:${rideId}`);

    // Notificar a otros en el room
    socket.to(`ride:${rideId}`).emit('ride:user_joined', {
      oderId: user.id,
      nombre: user.nombre,
      role: user.role,
    });
  });

  /**
   * Salir de un room de viaje
   * Evento: leave:ride
   * Data: { rideId: string }
   */
  socket.on('leave:ride', ({ rideId }) => {
    if (!rideId) return;

    socket.leave(`ride:${rideId}`);
    console.log(`   → ${user.nombre} left ride:${rideId}`);

    // Notificar a otros en el room
    socket.to(`ride:${rideId}`).emit('ride:user_left', {
      userId: user.id,
      nombre: user.nombre,
    });
  });

  /**
   * Unirse a room de chat
   * Evento: join:chat
   * Data: { chatId: string }
   */
  socket.on('join:chat', ({ chatId }) => {
    if (!chatId) return;

    socket.join(`chat:${chatId}`);
    console.log(`   → ${user.nombre} joined chat:${chatId}`);
  });

  /**
   * Salir de room de chat
   * Evento: leave:chat
   * Data: { chatId: string }
   */
  socket.on('leave:chat', ({ chatId }) => {
    if (!chatId) return;

    socket.leave(`chat:${chatId}`);
    console.log(`   → ${user.nombre} left chat:${chatId}`);
  });

  // ==========================================
  // PING/PONG PERSONALIZADO
  // ==========================================

  /**
   * Ping para mantener conexión viva
   * Evento: ping
   */
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // ==========================================
  // OBTENER ESTADO DE CONEXIÓN
  // ==========================================

  /**
   * Obtener información del socket actual
   * Evento: connection:info
   */
  socket.on('connection:info', (callback) => {
    if (typeof callback === 'function') {
      callback({
        socketId: socket.id,
        userId: user.id,
        role: user.role,
        rooms: Array.from(socket.rooms),
        connectedAt: socket.handshake.time,
      });
    }
  });

  // ==========================================
  // CLEANUP AL DESCONECTAR
  // ==========================================

  socket.on('disconnect', () => {
    // Los rooms se limpian automáticamente al desconectar
    // Aquí podemos agregar lógica adicional si es necesario
  });
};

export default connectionHandler;
