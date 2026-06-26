import { supabaseAdmin } from '../config/supabase.js';

/**
 * Handler de eventos de viajes en tiempo real
 */
const rideHandler = (socket, io) => {
  const user = socket.user;

  if (!user) return;

  // ==========================================
  // SOLICITUD DE VIAJE (USUARIO)
  // ==========================================

  /**
   * Usuario solicita un viaje
   * Evento: ride:request
   * Data: { rideId: string }
   */
  socket.on('ride:request', async ({ rideId }) => {
    try {
      if (!rideId) {
        socket.emit('ride:error', { message: 'ID de viaje requerido' });
        return;
      }

      // Obtener datos del viaje
      const { data: ride, error } = await supabaseAdmin
        .from('rides')
        .select('*, user:user_id(id, nombre, apellido, avatar, rating_average)')
        .eq('id', rideId)
        .single();

      if (error || !ride) {
        socket.emit('ride:error', { message: 'Viaje no encontrado' });
        return;
      }

      // Unir al usuario al room del viaje
      socket.join(`ride:${rideId}`);

      // La notificación a conductores la maneja rideQueueService
      // que filtra por tipo de conductor y distancia
      console.log(`🚗 Nuevo viaje solicitado: ${rideId} (tipo: ${ride.service_type})`);

    } catch (error) {
      console.error('Error in ride:request:', error);
      socket.emit('ride:error', { message: 'Error al procesar solicitud' });
    }
  });

  // ==========================================
  // ACEPTAR VIAJE (CONDUCTOR)
  // ==========================================

  /**
   * Conductor acepta un viaje
   * Evento: ride:accept
   * Data: { rideId: string }
   */
  socket.on('ride:accept', async ({ rideId }) => {
    try {
      if (user.role !== 'driver') {
        socket.emit('ride:error', { message: 'Solo conductores pueden aceptar viajes' });
        return;
      }

      // Verificar que el viaje existe y está pendiente
      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .eq('status', 'pending')
        .single();

      if (rideError || !ride) {
        socket.emit('ride:error', { message: 'Viaje no disponible' });
        return;
      }

      // Verificar que el conductor es del tipo correcto
      const typeMapping = {
        'vuelta-segura': 'vuelta_segura', 'vuelta_segura': 'vuelta_segura',
        'chofer': 'chofer', 'flete': 'fletes', 'fletes': 'fletes',
      };
      const requiredType = typeMapping[ride.service_type] || ride.service_type;
      const { data: driverProfile } = await supabaseAdmin
        .from('profiles')
        .select('driver_type')
        .eq('id', user.id)
        .single();

      if (driverProfile?.driver_type !== requiredType) {
        socket.emit('ride:error', { message: 'Tu tipo de conductor no corresponde a este servicio' });
        return;
      }

      // Actualizar viaje con conductor asignado
      const { error: updateError } = await supabaseAdmin
        .from('rides')
        .update({
          driver_id: user.id,
          status: 'driver-assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (updateError) {
        socket.emit('ride:error', { message: 'Error al aceptar viaje' });
        return;
      }

      // Unir conductor al room del viaje
      socket.join(`ride:${rideId}`);

      // Salir de conductores disponibles
      socket.leave('drivers:available');

      // Obtener datos del conductor
      const driverInfo = {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        avatar: user.avatar,
        rating: user.rating_average,
        telefono: user.telefono_numero,
      };

      // Emitir a todos en el room del viaje
      io.to(`ride:${rideId}`).emit('ride:accepted', {
        rideId,
        driver: driverInfo,
        status: 'driver-assigned',
        acceptedAt: new Date().toISOString(),
      });

      // Remover de la lista de viajes disponibles para otros conductores
      io.to('drivers:available').emit('ride:taken', { rideId });

      console.log(`✅ Viaje ${rideId} aceptado por ${user.nombre}`);

    } catch (error) {
      console.error('Error in ride:accept:', error);
      socket.emit('ride:error', { message: 'Error al aceptar viaje' });
    }
  });

  // ==========================================
  // CAMBIOS DE ESTADO DEL VIAJE
  // ==========================================

  /**
   * Conductor llegó al punto de recogida
   * Evento: ride:arrived
   * Data: { rideId: string }
   */
  socket.on('ride:arrived', async ({ rideId }) => {
    try {
      if (user.role !== 'driver') return;

      // Obtener user_id del viaje
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('user_id')
        .eq('id', rideId)
        .single();

      await supabaseAdmin
        .from('rides')
        .update({ status: 'driver-arrived', updated_at: new Date().toISOString() })
        .eq('id', rideId)
        .eq('driver_id', user.id);

      const statusPayload = {
        rideId,
        status: 'driver-arrived',
        timestamp: new Date().toISOString(),
      };

      io.to(`ride:${rideId}`).emit('ride:status_changed', statusPayload);
      if (ride?.user_id) {
        io.to(`user:${ride.user_id}`).emit('ride:status_changed', statusPayload);
      }

      console.log(`📍 Conductor llegó: ${rideId}`);

    } catch (error) {
      console.error('Error in ride:arrived:', error);
    }
  });

  /**
   * Viaje iniciado (pasajero a bordo)
   * Evento: ride:start
   * Data: { rideId: string }
   */
  socket.on('ride:start', async ({ rideId }) => {
    try {
      if (user.role !== 'driver') return;

      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('user_id')
        .eq('id', rideId)
        .single();

      await supabaseAdmin
        .from('rides')
        .update({ status: 'in-progress', updated_at: new Date().toISOString() })
        .eq('id', rideId)
        .eq('driver_id', user.id);

      const statusPayload = {
        rideId,
        status: 'in-progress',
        timestamp: new Date().toISOString(),
      };

      io.to(`ride:${rideId}`).emit('ride:status_changed', statusPayload);
      if (ride?.user_id) {
        io.to(`user:${ride.user_id}`).emit('ride:status_changed', statusPayload);
      }

      console.log(`🚀 Viaje iniciado: ${rideId}`);

    } catch (error) {
      console.error('Error in ride:start:', error);
    }
  });

  /**
   * Viaje completado
   * Evento: ride:complete
   * Data: { rideId: string, actualPrice?: number }
   */
  socket.on('ride:complete', async ({ rideId, actualPrice }) => {
    try {
      if (user.role !== 'driver') return;

      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('user_id')
        .eq('id', rideId)
        .single();

      const updateData = {
        status: 'completed',
        updated_at: new Date().toISOString(),
      };

      if (actualPrice) {
        updateData.actual_price = actualPrice;
      }

      await supabaseAdmin
        .from('rides')
        .update(updateData)
        .eq('id', rideId)
        .eq('driver_id', user.id);

      const statusPayload = {
        rideId,
        status: 'completed',
        actualPrice,
        timestamp: new Date().toISOString(),
      };

      io.to(`ride:${rideId}`).emit('ride:status_changed', statusPayload);
      if (ride?.user_id) {
        io.to(`user:${ride.user_id}`).emit('ride:status_changed', statusPayload);
      }

      // Conductor vuelve a estar disponible
      socket.join('drivers:available');

      console.log(`🏁 Viaje completado: ${rideId}`);

    } catch (error) {
      console.error('Error in ride:complete:', error);
    }
  });

  /**
   * Viaje cancelado
   * Evento: ride:cancel
   * Data: { rideId: string, reason?: string, cancelledBy: 'user' | 'driver' }
   */
  socket.on('ride:cancel', async ({ rideId, reason, cancelledBy }) => {
    try {
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('user_id')
        .eq('id', rideId)
        .single();

      await supabaseAdmin
        .from('rides')
        .update({
          status: 'cancelled',
          notes: reason || 'Cancelado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      const statusPayload = {
        rideId,
        status: 'cancelled',
        reason,
        cancelledBy: cancelledBy || user.role,
        timestamp: new Date().toISOString(),
      };

      io.to(`ride:${rideId}`).emit('ride:status_changed', statusPayload);
      if (ride?.user_id) {
        io.to(`user:${ride.user_id}`).emit('ride:status_changed', statusPayload);
      }

      // Si el conductor cancela, volver a disponible
      if (user.role === 'driver') {
        socket.join('drivers:available');
      }

      console.log(`❌ Viaje cancelado: ${rideId} por ${cancelledBy || user.role}`);

    } catch (error) {
      console.error('Error in ride:cancel:', error);
    }
  });

  // ==========================================
  // ETA UPDATES
  // ==========================================

  /**
   * Actualizar ETA del conductor
   * Evento: ride:eta_update
   * Data: { rideId: string, eta: number }
   */
  socket.on('ride:eta_update', ({ rideId, eta }) => {
    if (user.role !== 'driver') return;

    io.to(`ride:${rideId}`).emit('ride:eta_changed', {
      rideId,
      eta, // minutos
      timestamp: new Date().toISOString(),
    });
  });
};

export default rideHandler;
