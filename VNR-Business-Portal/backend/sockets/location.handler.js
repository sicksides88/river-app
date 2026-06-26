import { supabaseAdmin } from '../config/supabase.js';
import notificationService from '../services/notification.service.js';

/**
 * Calcular distancia entre dos puntos (Haversine) en metros
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Handler de ubicación en tiempo real
 * Maneja el tracking de conductores cada 5 segundos
 */
const locationHandler = (socket, io) => {
  const user = socket.user;

  if (!user) return;

  // ==========================================
  // ACTUALIZACIÓN DE UBICACIÓN (CONDUCTOR)
  // ==========================================

  /**
   * Conductor envía su ubicación actual
   * Evento: location:update
   * Data: {
   *   rideId?: string,
   *   latitude: number,
   *   longitude: number,
   *   heading?: number,
   *   speed?: number,
   *   accuracy?: number
   * }
   */
  socket.on('location:update', async (data) => {
    try {
      if (user.role !== 'driver') return;

      const { rideId, latitude, longitude, heading, speed, accuracy } = data;

      if (!latitude || !longitude) {
        return;
      }

      const locationData = {
        driver_id: user.id,
        ride_id: rideId || null,
        latitude,
        longitude,
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 0,
        timestamp: new Date().toISOString(),
      };

      // Guardar en base de datos (si hay viaje activo)
      if (rideId) {
        await supabaseAdmin
          .from('driver_locations')
          .insert(locationData)
          .select()
          .single();

        // Emitir a todos en el room del viaje
        io.to(`ride:${rideId}`).emit('driver:location', {
          driverId: user.id,
          location: {
            latitude,
            longitude,
            heading,
            speed,
          },
          timestamp: locationData.timestamp,
        });

        // ==========================================
        // NOTIFICACIÓN DE PROXIMIDAD (< 200m)
        // ==========================================
        try {
          // Obtener datos del viaje para verificar proximidad
          const { data: ride } = await supabaseAdmin
            .from('rides')
            .select('user_id, status, pickup_lat, pickup_lng, nearby_notification_sent')
            .eq('id', rideId)
            .single();

          // Solo enviar si el viaje está en estado 'accepted' o 'en_route' y no se ha enviado antes
          if (ride &&
              ['accepted', 'en_route'].includes(ride.status) &&
              !ride.nearby_notification_sent &&
              ride.pickup_lat &&
              ride.pickup_lng) {

            const distanceToPickup = getDistanceMeters(
              latitude,
              longitude,
              parseFloat(ride.pickup_lat),
              parseFloat(ride.pickup_lng)
            );

            // Si está a menos de 200 metros del punto de recogida
            if (distanceToPickup < 200) {
              // Enviar notificación push al usuario
              await notificationService.sendDriverNearby(ride.user_id, {
                rideId,
                driverId: user.id,
                driverName: user.nombre,
                distance: Math.round(distanceToPickup),
              });

              // Marcar que ya se envió la notificación
              await supabaseAdmin
                .from('rides')
                .update({ nearby_notification_sent: true })
                .eq('id', rideId);

              // Emitir evento WebSocket al usuario
              io.to(`user:${ride.user_id}`).emit('driver:nearby', {
                rideId,
                driverId: user.id,
                driverName: user.nombre,
                distance: Math.round(distanceToPickup),
              });

              console.log(`📍 Driver ${user.nombre} está cerca del pickup (${Math.round(distanceToPickup)}m)`);
            }
          }
        } catch (proximityError) {
          // No fallar el update de ubicación si hay error en notificación
          console.error('Error checking proximity:', proximityError);
        }
      }

      // También emitir a room personal del conductor (para admin tracking)
      socket.to(`driver:${user.id}`).emit('driver:location', {
        driverId: user.id,
        location: {
          latitude,
          longitude,
          heading,
          speed,
        },
        timestamp: locationData.timestamp,
      });

    } catch (error) {
      console.error('Error in location:update:', error);
    }
  });

  // ==========================================
  // BATCH UPDATE (PARA RECONEXIÓN)
  // ==========================================

  /**
   * Enviar múltiples ubicaciones acumuladas (después de reconexión)
   * Evento: location:batch_update
   * Data: { rideId?: string, locations: Array<LocationData> }
   */
  socket.on('location:batch_update', async ({ rideId, locations }) => {
    try {
      if (user.role !== 'driver' || !locations?.length) return;

      const locationsWithDriver = locations.map((loc) => ({
        driver_id: user.id,
        ride_id: rideId || null,
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading || 0,
        speed: loc.speed || 0,
        accuracy: loc.accuracy || 0,
        timestamp: loc.timestamp || new Date().toISOString(),
      }));

      // Insertar todas las ubicaciones
      await supabaseAdmin
        .from('driver_locations')
        .insert(locationsWithDriver);

      // Emitir última ubicación
      const lastLocation = locations[locations.length - 1];
      if (rideId) {
        io.to(`ride:${rideId}`).emit('driver:location', {
          driverId: user.id,
          location: {
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
            heading: lastLocation.heading,
            speed: lastLocation.speed,
          },
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`📍 Batch update: ${locations.length} ubicaciones de ${user.nombre}`);

    } catch (error) {
      console.error('Error in location:batch_update:', error);
    }
  });

  // ==========================================
  // SUSCRIPCIÓN A UBICACIÓN DE CONDUCTOR
  // ==========================================

  /**
   * Usuario se suscribe a ubicación de un conductor
   * Evento: location:subscribe
   * Data: { driverId: string, rideId: string }
   */
  socket.on('location:subscribe', async ({ driverId, rideId }) => {
    try {
      if (!driverId || !rideId) return;

      // Verificar que el usuario es parte del viaje
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('user_id, driver_id')
        .eq('id', rideId)
        .single();

      if (!ride || (ride.user_id !== user.id && ride.driver_id !== user.id)) {
        socket.emit('location:error', { message: 'No autorizado' });
        return;
      }

      // Unir al room del viaje
      socket.join(`ride:${rideId}`);

      // Obtener última ubicación conocida
      const { data: lastLocation } = await supabaseAdmin
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .eq('ride_id', rideId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (lastLocation) {
        socket.emit('driver:location', {
          driverId,
          location: {
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
            heading: lastLocation.heading,
            speed: lastLocation.speed,
          },
          timestamp: lastLocation.timestamp,
        });
      }

    } catch (error) {
      console.error('Error in location:subscribe:', error);
    }
  });

  /**
   * Usuario cancela suscripción a ubicación
   * Evento: location:unsubscribe
   * Data: { rideId: string }
   */
  socket.on('location:unsubscribe', ({ rideId }) => {
    if (rideId) {
      socket.leave(`ride:${rideId}`);
    }
  });

  // ==========================================
  // OBTENER HISTORIAL DE UBICACIÓN
  // ==========================================

  /**
   * Obtener historial de ubicación de un viaje
   * Evento: location:history
   * Data: { rideId: string }
   */
  socket.on('location:history', async ({ rideId }, callback) => {
    try {
      if (!rideId || typeof callback !== 'function') return;

      const { data: locations, error } = await supabaseAdmin
        .from('driver_locations')
        .select('latitude, longitude, heading, speed, timestamp')
        .eq('ride_id', rideId)
        .order('timestamp', { ascending: true });

      if (error) {
        callback({ success: false, error: 'Error al obtener historial' });
        return;
      }

      callback({
        success: true,
        locations: locations || [],
      });

    } catch (error) {
      console.error('Error in location:history:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Error interno' });
      }
    }
  });

  // ==========================================
  // OBTENER CONDUCTORES CERCANOS
  // ==========================================

  /**
   * Usuario solicita conductores disponibles cercanos
   * Evento: drivers:nearby
   * Data: { latitude: number, longitude: number, radius: number (km) }
   */
  socket.on('drivers:nearby', async ({ latitude, longitude, radius = 5 }) => {
    try {
      if (!latitude || !longitude) {
        socket.emit('drivers:nearby:response', { drivers: [], error: 'Coordenadas requeridas' });
        return;
      }

      // Obtener conductores disponibles (online y no en viaje)
      const { data: availableDrivers, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          nombre,
          apellido,
          avatar,
          rating,
          is_available,
          driver_status
        `)
        .eq('role', 'driver')
        .eq('is_available', true)
        .eq('driver_status', 'online');

      if (error) {
        console.error('Error fetching available drivers:', error);
        socket.emit('drivers:nearby:response', { drivers: [] });
        return;
      }

      // Obtener última ubicación de cada conductor
      const driversWithLocation = await Promise.all(
        (availableDrivers || []).map(async (driver) => {
          const { data: location } = await supabaseAdmin
            .from('driver_locations')
            .select('latitude, longitude, heading, timestamp')
            .eq('driver_id', driver.id)
            .is('ride_id', null) // Solo ubicaciones cuando no están en viaje
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

          if (!location) return null;

          // Verificar que la ubicación es reciente (últimos 5 minutos)
          const locationTime = new Date(location.timestamp);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (locationTime < fiveMinutesAgo) return null;

          // Calcular distancia
          const distance = getDistanceMeters(
            latitude,
            longitude,
            location.latitude,
            location.longitude
          ) / 1000; // Convertir a km

          // Filtrar por radio
          if (distance > radius) return null;

          return {
            id: driver.id,
            name: `${driver.nombre || ''} ${driver.apellido || ''}`.trim(),
            avatar: driver.avatar,
            rating: driver.rating || 4.5,
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              heading: location.heading || 0,
            },
            distance: Math.round(distance * 10) / 10, // Redondear a 1 decimal
            eta: Math.ceil(distance * 3), // Estimación simple: 3 min por km
          };
        })
      );

      // Filtrar nulls y ordenar por distancia
      const nearbyDrivers = driversWithLocation
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      socket.emit('drivers:nearby:response', {
        drivers: nearbyDrivers,
        count: nearbyDrivers.length,
        searchRadius: radius,
      });

      console.log(`🚗 Found ${nearbyDrivers.length} nearby drivers for user ${user.id}`);

    } catch (error) {
      console.error('Error in drivers:nearby:', error);
      socket.emit('drivers:nearby:response', { drivers: [], error: 'Error interno' });
    }
  });
};

export default locationHandler;
