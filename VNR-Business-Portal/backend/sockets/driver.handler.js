import { supabaseAdmin } from '../config/supabase.js';

/**
 * Handler de disponibilidad de conductores
 */
const driverHandler = (socket, io) => {
  const user = socket.user;

  // Verificar que sea conductor (por role o por is_driver)
  if (!user || (user.role !== 'driver' && user.is_driver !== true)) return;

  // ==========================================
  // GESTIÓN DE DISPONIBILIDAD
  // ==========================================

  /**
   * Conductor se pone disponible
   * Evento: driver:online
   * Data: { location?: { latitude, longitude } }
   */
  socket.on('driver:online', async ({ location } = {}) => {
    try {
      // Actualizar estado en BD
      await supabaseAdmin
        .from('profiles')
        .update({
          availability_status: 'online',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Unirse al room de conductores disponibles
      socket.join('drivers:available');

      // Si tiene ubicación, guardarla
      if (location?.latitude && location?.longitude) {
        await supabaseAdmin
          .from('driver_locations')
          .insert({
            driver_id: user.id,
            latitude: location.latitude,
            longitude: location.longitude,
            heading: 0,
            speed: 0,
            accuracy: 0,
          });
      }

      // Crear nueva sesion de conexion para tracking de tiempo
      try {
        // Primero cerrar cualquier sesion activa previa
        await supabaseAdmin
          .from('driver_sessions')
          .update({
            ended_at: new Date().toISOString(),
            status: 'forced_end',
          })
          .eq('driver_id', user.id)
          .eq('status', 'active');

        // Crear nueva sesion
        const { data: session } = await supabaseAdmin
          .from('driver_sessions')
          .insert({
            driver_id: user.id,
            started_at: new Date().toISOString(),
            status: 'active',
            device_info: { socketId: socket.id },
          })
          .select('id')
          .single();

        // Guardar ID de sesion en el socket para cerrarla despues
        socket.driverSessionId = session?.id;
      } catch (sessionError) {
        // Si la tabla no existe, ignorar (backward compatibility)
        console.log('Note: driver_sessions table may not exist yet');
      }

      // Confirmar al conductor
      socket.emit('driver:status_changed', {
        status: 'online',
        timestamp: new Date().toISOString(),
      });

      console.log(`🟢 Conductor online: ${user.nombre}`);

    } catch (error) {
      console.error('Error in driver:online:', error);
      socket.emit('driver:error', { message: 'Error al cambiar disponibilidad' });
    }
  });

  /**
   * Conductor se pone offline
   * Evento: driver:offline
   */
  socket.on('driver:offline', async () => {
    try {
      // Actualizar estado en BD
      await supabaseAdmin
        .from('profiles')
        .update({
          availability_status: 'offline',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Salir del room de conductores disponibles
      socket.leave('drivers:available');

      // Cerrar sesion de conexion
      if (socket.driverSessionId) {
        try {
          await supabaseAdmin
            .from('driver_sessions')
            .update({
              ended_at: new Date().toISOString(),
              status: 'ended',
            })
            .eq('id', socket.driverSessionId);
          socket.driverSessionId = null;
        } catch (sessionError) {
          console.log('Note: Could not close driver session');
        }
      }

      // Confirmar al conductor
      socket.emit('driver:status_changed', {
        status: 'offline',
        timestamp: new Date().toISOString(),
      });

      console.log(`🔴 Conductor offline: ${user.nombre}`);

    } catch (error) {
      console.error('Error in driver:offline:', error);
    }
  });

  /**
   * Conductor en pausa (break)
   * Evento: driver:pause
   * Data: { reason?: string }
   */
  socket.on('driver:pause', async ({ reason } = {}) => {
    try {
      await supabaseAdmin
        .from('profiles')
        .update({
          availability_status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      socket.leave('drivers:available');

      socket.emit('driver:status_changed', {
        status: 'paused',
        reason,
        timestamp: new Date().toISOString(),
      });

      console.log(`⏸️ Conductor en pausa: ${user.nombre}`);

    } catch (error) {
      console.error('Error in driver:pause:', error);
    }
  });

  /**
   * Obtener estado actual del conductor
   * Evento: driver:status
   */
  socket.on('driver:status', async (callback) => {
    try {
      if (typeof callback !== 'function') return;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('availability_status')
        .eq('id', user.id)
        .single();

      const isInAvailableRoom = socket.rooms.has('drivers:available');

      callback({
        success: true,
        status: profile?.availability_status || 'offline',
        isAvailable: isInAvailableRoom,
      });

    } catch (error) {
      console.error('Error in driver:status:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error al obtener estado' });
      }
    }
  });

  // ==========================================
  // ESTADÍSTICAS EN TIEMPO REAL
  // ==========================================

  /**
   * Obtener estadísticas del día
   * Evento: driver:stats
   */
  socket.on('driver:stats', async (callback) => {
    try {
      if (typeof callback !== 'function') return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Viajes completados hoy
      const { data: rides, error } = await supabaseAdmin
        .from('rides')
        .select('actual_price, distance, duration')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('updated_at', today.toISOString());

      if (error) {
        callback({ success: false, error: 'Error al obtener estadísticas' });
        return;
      }

      // Calcular tiempo online hoy
      let timeOnlineToday = 0;
      try {
        const { data: sessions } = await supabaseAdmin
          .from('driver_sessions')
          .select('started_at, ended_at')
          .eq('driver_id', user.id)
          .gte('started_at', today.toISOString());

        if (sessions && sessions.length > 0) {
          const now = new Date();
          for (const session of sessions) {
            const start = new Date(session.started_at);
            const end = session.ended_at ? new Date(session.ended_at) : now;
            const minutes = (end - start) / (1000 * 60);
            timeOnlineToday += minutes;
          }
        }
      } catch (sessionError) {
        // Si la tabla no existe, ignorar
        console.log('Note: driver_sessions table may not exist yet');
      }

      const stats = {
        tripsToday: rides.length,
        earningsToday: rides.reduce((sum, r) => sum + (r.actual_price || 0), 0),
        distanceToday: rides.reduce((sum, r) => sum + (r.distance || 0), 0),
        timeOnlineToday: Math.round(timeOnlineToday),
      };

      callback({ success: true, stats });

    } catch (error) {
      console.error('Error in driver:stats:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error interno' });
      }
    }
  });

  // ==========================================
  // CLEANUP AL DESCONECTAR
  // ==========================================

  socket.on('disconnect', async () => {
    try {
      // Marcar como offline en BD
      await supabaseAdmin
        .from('profiles')
        .update({
          availability_status: 'offline',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Cerrar sesion de conexion si existe
      if (socket.driverSessionId) {
        try {
          await supabaseAdmin
            .from('driver_sessions')
            .update({
              ended_at: new Date().toISOString(),
              status: 'ended',
            })
            .eq('id', socket.driverSessionId);
        } catch (sessionError) {
          console.log('Note: Could not close driver session on disconnect');
        }
      }

      console.log(`❌ Conductor desconectado: ${user.nombre}`);

    } catch (error) {
      console.error('Error updating driver status on disconnect:', error);
    }
  });
};

export default driverHandler;
