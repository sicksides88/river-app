import { supabaseAdmin } from '../config/supabase.js';
import { driverWalletService } from '../services/driverWallet.service.js';

/**
 * Handler de eventos de envíos/deliveries en tiempo real
 */
const deliveryHandler = (socket, io) => {
  const user = socket.user;

  if (!user) return;

  // Helper para verificar si es conductor
  const isDriver = user.role === 'driver' || user.is_driver === true;

  // ==========================================
  // ACEPTAR ENVÍO (CONDUCTOR)
  // ==========================================

  /**
   * Conductor acepta un envío
   * Evento: delivery:accept
   * Data: { deliveryId: string, vehicleId?: string }
   */
  socket.on('delivery:accept', async ({ deliveryId, vehicleId }) => {
    try {
      if (!isDriver) {
        socket.emit('delivery:error', { message: 'Solo conductores pueden aceptar envíos' });
        return;
      }

      // Verificar que el envío existe y está pendiente
      const { data: delivery, error: deliveryError } = await supabaseAdmin
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .eq('status', 'pending')
        .single();

      if (deliveryError || !delivery) {
        socket.emit('delivery:error', { message: 'Envío no disponible' });
        return;
      }

      // Verificar que el conductor es del tipo correcto para este envío
      const allowedTypes = { 'envio': 'cadete', 'envio_express': 'cadete', 'flete': 'fletes', 'fletes': 'fletes' };
      const requiredType = allowedTypes[delivery.service_type] || 'cadete';
      const { data: driverProfile } = await supabaseAdmin
        .from('profiles')
        .select('driver_type')
        .eq('id', user.id)
        .single();

      if (driverProfile?.driver_type !== requiredType) {
        socket.emit('delivery:error', { message: 'Tu tipo de conductor no corresponde a este servicio' });
        return;
      }

      // Actualizar envío con conductor asignado
      const { error: updateError } = await supabaseAdmin
        .from('deliveries')
        .update({
          driver_id: user.id,
          status: 'confirmed',
        })
        .eq('id', deliveryId);

      if (updateError) {
        socket.emit('delivery:error', { message: 'Error al aceptar envío' });
        return;
      }

      // Unir conductor al room del envío
      socket.join(`delivery:${deliveryId}`);

      // Salir de conductores disponibles
      socket.leave('drivers:available');

      // Obtener datos del vehículo si se especificó
      let vehicleInfo = null;
      if (vehicleId) {
        const { data: vehicle } = await supabaseAdmin
          .from('driver_vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();

        if (vehicle) {
          vehicleInfo = {
            brand: vehicle.brand,
            model: vehicle.model,
            plate: vehicle.plate_number,
            color: vehicle.color,
          };
        }
      }

      // Obtener datos del conductor con formato para el frontend
      const driverInfo = {
        id: user.id,
        name: `${user.nombre} ${user.apellido}`.trim(),
        nombre: user.nombre,
        apellido: user.apellido,
        avatar: user.avatar,
        rating: user.rating_average || 5.0,
        phone: user.telefono_numero,
        vehicle: vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : 'Vehículo',
        plate: vehicleInfo?.plate || '---',
        vehicleColor: vehicleInfo?.color,
      };

      // Emitir al usuario que su envío fue aceptado
      io.to(`user:${delivery.user_id}`).emit('delivery:accepted', {
        deliveryId,
        driver: driverInfo,
        status: 'confirmed',
        acceptedAt: new Date().toISOString(),
      });

      // Remover de la lista de envíos disponibles para otros conductores
      io.to('drivers:available').emit('delivery:taken', { deliveryId });

      console.log(`📦 Envío ${deliveryId} aceptado por ${user.nombre}`);

    } catch (error) {
      console.error('Error in delivery:accept:', error);
      socket.emit('delivery:error', { message: 'Error al aceptar envío' });
    }
  });

  // ==========================================
  // CAMBIOS DE ESTADO DEL ENVÍO
  // ==========================================

  /**
   * Conductor llegó al punto de recogida
   * Evento: delivery:arrived_pickup
   * Data: { deliveryId: string }
   */
  socket.on('delivery:arrived_pickup', async ({ deliveryId }) => {
    try {
      if (!isDriver) return;

      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .update({
          status: 'arrived_pickup',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)
        .eq('driver_id', user.id)
        .select()
        .single();

      if (delivery) {
        io.to(`user:${delivery.user_id}`).emit('delivery:status_changed', {
          deliveryId,
          status: 'arrived_pickup',
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`📍 Conductor llegó a recoger envío: ${deliveryId}`);

    } catch (error) {
      console.error('Error in delivery:arrived_pickup:', error);
    }
  });

  /**
   * Envío recogido (paquete en manos del conductor)
   * Evento: delivery:picked_up
   * Data: { deliveryId: string }
   */
  socket.on('delivery:picked_up', async ({ deliveryId }) => {
    try {
      if (!isDriver) return;

      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .update({
          status: 'picked_up',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)
        .eq('driver_id', user.id)
        .select()
        .single();

      if (delivery) {
        io.to(`user:${delivery.user_id}`).emit('delivery:status_changed', {
          deliveryId,
          status: 'picked_up',
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`📦 Envío recogido: ${deliveryId}`);

    } catch (error) {
      console.error('Error in delivery:picked_up:', error);
    }
  });

  /**
   * Envío en tránsito
   * Evento: delivery:in_transit
   * Data: { deliveryId: string }
   */
  socket.on('delivery:in_transit', async ({ deliveryId }) => {
    try {
      if (!isDriver) return;

      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .update({
          status: 'in_transit',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)
        .eq('driver_id', user.id)
        .select()
        .single();

      if (delivery) {
        io.to(`user:${delivery.user_id}`).emit('delivery:status_changed', {
          deliveryId,
          status: 'in_transit',
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`🚚 Envío en tránsito: ${deliveryId}`);

    } catch (error) {
      console.error('Error in delivery:in_transit:', error);
    }
  });

  /**
   * Conductor llegó al punto de entrega
   * Evento: delivery:arrived_dropoff
   * Data: { deliveryId: string }
   */
  socket.on('delivery:arrived_dropoff', async ({ deliveryId }) => {
    try {
      if (!isDriver) return;

      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .update({
          status: 'arrived_dropoff',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)
        .eq('driver_id', user.id)
        .select()
        .single();

      if (delivery) {
        io.to(`user:${delivery.user_id}`).emit('delivery:status_changed', {
          deliveryId,
          status: 'arrived_dropoff',
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`📍 Conductor llegó a entregar: ${deliveryId}`);

    } catch (error) {
      console.error('Error in delivery:arrived_dropoff:', error);
    }
  });

  /**
   * Envío entregado
   * Evento: delivery:delivered
   * Data: { deliveryId: string, actualPrice?: number }
   */
  socket.on('delivery:delivered', async ({ deliveryId, actualPrice }) => {
    try {
      if (!isDriver) return;

      const updateData = {
        status: 'delivered',
        updated_at: new Date().toISOString(),
      };

      if (actualPrice) {
        updateData.actual_price = actualPrice;
      }

      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId)
        .eq('driver_id', user.id)
        .select()
        .single();

      if (delivery) {
        io.to(`user:${delivery.user_id}`).emit('delivery:status_changed', {
          deliveryId,
          status: 'delivered',
          actualPrice: actualPrice || delivery.estimated_price,
          timestamp: new Date().toISOString(),
        });

        // Si es delivery de comercio, crear cargo al comercio
        if (delivery.business_id) {
          try {
            const chargeAmount = actualPrice || delivery.estimated_price || 0;

            // Obtener commission settings para envio
            let platformPct = 20;
            let driverPct = 80;
            const { data: commSettings } = await supabaseAdmin
              .from('commission_settings')
              .select('platform_percentage, driver_percentage')
              .eq('service_type', 'envio')
              .eq('is_active', true)
              .order('effective_from', { ascending: false })
              .limit(1)
              .single();

            if (commSettings) {
              platformPct = commSettings.platform_percentage;
              driverPct = commSettings.driver_percentage;
            }

            const platformFee = Math.round(chargeAmount * platformPct / 100);
            const driverAmount = chargeAmount - platformFee;

            // Crear cargo al comercio
            await supabaseAdmin
              .from('business_charges')
              .insert({
                business_id: delivery.business_id,
                delivery_id: deliveryId,
                amount: chargeAmount,
                platform_fee: platformFee,
                driver_amount: driverAmount,
                status: 'pending',
              });

            console.log(`💰 Cargo creado al comercio: $${chargeAmount} (envío ${deliveryId})`);

            // Acreditar ganancia al cadete en su billetera
            try {
              const { data: existingEarning } = await supabaseAdmin
                .from('driver_earnings')
                .select('id')
                .eq('delivery_id', deliveryId)
                .maybeSingle();

              if (!existingEarning) {
                const earningResult = await driverWalletService.addEarning({
                  driverId: user.id,
                  deliveryId,
                  grossAmount: chargeAmount,
                  serviceType: delivery.service_type || 'envio',
                });

                console.log(`💳 Ganancia acreditada al cadete ${user.nombre}: $${earningResult.netAmount} (envío ${deliveryId})`);

                // Notificar al cadete que tiene nueva ganancia
                io.to(`driver:${user.id}`).emit('wallet:earning_added', {
                  deliveryId,
                  grossAmount: chargeAmount,
                  netAmount: earningResult.netAmount,
                  platformFee: earningResult.platformFee,
                  availableAt: earningResult.availableAt,
                });
              }
            } catch (walletErr) {
              console.error('Error acreditando ganancia al cadete:', walletErr);
            }
          } catch (chargeErr) {
            console.error('Error creando cargo al comercio:', chargeErr);
          }
        }
      }

      // Conductor vuelve a estar disponible
      socket.join('drivers:available');

      console.log(`✅ Envío entregado: ${deliveryId}`);

    } catch (error) {
      console.error('Error in delivery:delivered:', error);
    }
  });

  /**
   * Envío cancelado
   * Evento: delivery:cancel
   * Data: { deliveryId: string, reason?: string, cancelledBy: 'user' | 'driver' }
   */
  socket.on('delivery:cancel', async ({ deliveryId, reason, cancelledBy }) => {
    try {
      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .update({
          status: 'cancelled',
          notes: reason || 'Cancelado',
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (delivery) {
        // Notificar al usuario
        io.to(`user:${delivery.user_id}`).emit('delivery:status_changed', {
          deliveryId,
          status: 'cancelled',
          reason,
          cancelledBy: cancelledBy || user.role,
          timestamp: new Date().toISOString(),
        });

        // Notificar al conductor si fue el usuario quien canceló
        if (delivery.driver_id && cancelledBy === 'user') {
          io.to(`driver:${delivery.driver_id}`).emit('delivery:status_changed', {
            deliveryId,
            status: 'cancelled',
            reason,
            cancelledBy: 'user',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Si el conductor cancela, volver a disponible
      if (user.role === 'driver') {
        socket.join('drivers:available');
      }

      console.log(`❌ Envío cancelado: ${deliveryId} por ${cancelledBy || user.role}`);

    } catch (error) {
      console.error('Error in delivery:cancel:', error);
    }
  });

  // ==========================================
  // ACTUALIZACIONES DE UBICACIÓN
  // ==========================================

  /**
   * Actualizar ubicación del conductor durante el envío
   * Evento: delivery:location_update
   * Data: { deliveryId: string, lat: number, lng: number, heading?: number }
   */
  socket.on('delivery:location_update', async ({ deliveryId, lat, lng, heading }) => {
    if (!isDriver) return;

    // Obtener el user_id del envío para notificarle
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select('user_id')
      .eq('id', deliveryId)
      .eq('driver_id', user.id)
      .single();

    if (error || !delivery) return;

    io.to(`user:${delivery.user_id}`).emit('delivery:driver_location', {
      deliveryId,
      location: { lat, lng, heading: heading || 0 },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Actualizar ETA del conductor
   * Evento: delivery:eta_update
   * Data: { deliveryId: string, eta: number }
   */
  socket.on('delivery:eta_update', async ({ deliveryId, eta }) => {
    if (!isDriver) return;

    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('user_id')
      .eq('id', deliveryId)
      .eq('driver_id', user.id)
      .single();

    if (delivery) {
      io.to(`user:${delivery.user_id}`).emit('delivery:eta_changed', {
        deliveryId,
        eta, // minutos
        timestamp: new Date().toISOString(),
      });
    }
  });
};

export default deliveryHandler;
