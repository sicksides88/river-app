import { supabaseAdmin } from "../config/supabase.js";
import notificationService from "../services/notification.service.js";
import rideQueueService from "../services/rideQueue.service.js";
import driverWalletService from "../services/driverWallet.service.js";
import priceRulesService from "../services/priceRules.service.js";
import { estimatePrice } from "../services/pricing.service.js";
import { emitToUser, emitToRide, emitToAvailableDrivers } from "../config/socket.js";
import {
  appendCancellationToNotes,
  readCancellationReason,
  parseRideNotes,
  setEtaMinutes,
  appendTimelineEvent,
  mapRiverStatusToDb,
  mapDbStatusToRiver,
} from "../utils/rideNotes.js";

// @desc    Crear una solicitud de viaje
// @route   POST /api/rides
// @access  Private
export const createRide = async (req, res) => {
  try {
    console.log('🚗 POST /api/rides - Creando viaje...');
    console.log('   Usuario:', req.user?.id);
    console.log('   Body:', JSON.stringify(req.body, null, 2));

    const {
      serviceType,
      pickup,
      dropoff,
      scheduledDate,
      scheduledTime,
      notes,
      estimatedPrice,
      distance,
      duration,
      paymentMethod,
    } = req.body;

    // Validar datos requeridos
    if (!pickup?.address || !dropoff?.address) {
      console.log('❌ Error: Se requiere dirección de origen y destino');
      return res.status(400).json({
        success: false,
        message: "Se requiere dirección de origen y destino",
      });
    }

    // PRECIO AUTORITATIVO: para servicios por km (vuelta-segura) recalcular
    // server-side desde las tarifas del CRM (service_rates) en vez de confiar en
    // el precio de la app. Chofer (single/round/hourly) conserva su precio por ahora.
    const st = serviceType || "vuelta-segura";
    let finalPrice = estimatedPrice;
    if (!st.includes("chofer")) {
      const est = await estimatePrice({ serviceType: st, distanceKm: Number(distance) || 0 });
      finalPrice = est.price;
    }

    // Crear el viaje en Supabase
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        user_id: req.user.id,
        service_type: serviceType || "vuelta-segura",
        pickup_address: pickup.address,
        pickup_lat: pickup.coordinates?.lat,
        pickup_lng: pickup.coordinates?.lng,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.coordinates?.lat,
        dropoff_lng: dropoff.coordinates?.lng,
        scheduled_date: scheduledDate,
        scheduled_hour: scheduledTime?.hour,
        scheduled_minute: scheduledTime?.minute,
        estimated_price: finalPrice,
        distance,
        duration,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Error creando viaje en BD:', error);
      throw error;
    }

    console.log('✅ Viaje creado:', ride.id);
    console.log('   Tipo:', ride.service_type);
    console.log('   Pickup:', ride.pickup_address);

    // Guardar las ubicaciones en el historial
    if (pickup.coordinates) {
      await supabaseAdmin
        .from('saved_locations')
        .upsert({
          user_id: req.user.id,
          address: pickup.address,
          lat: pickup.coordinates.lat,
          lng: pickup.coordinates.lng,
          location_type: 'pickup',
          last_used: new Date().toISOString(),
        }, {
          onConflict: 'user_id,address',
        });
    }

    if (dropoff.coordinates) {
      await supabaseAdmin
        .from('saved_locations')
        .upsert({
          user_id: req.user.id,
          address: dropoff.address,
          lat: dropoff.coordinates.lat,
          lng: dropoff.coordinates.lng,
          location_type: 'dropoff',
          last_used: new Date().toISOString(),
        }, {
          onConflict: 'user_id,address',
        });
    }

    // Si el método de pago no es efectivo, crear payment pendiente
    // para que el driver vea "Pago en progreso" al completar
    if (paymentMethod && paymentMethod !== 'cash') {
      try {
        await supabaseAdmin.from('payments').insert({
          ride_id: ride.id,
          user_id: req.user.id,
          amount: finalPrice,
          payment_method: paymentMethod,
          status: 'pending',
          description: `Pago pendiente por viaje`,
        });
      } catch (paymentErr) {
        console.log('Error creando payment pendiente:', paymentErr.message);
      }
    }

    // Responder primero para que el frontend navegue y monte los listeners
    res.status(201).json({
      success: true,
      message: "Solicitud de viaje creada exitosamente",
      ride: formatRide(ride),
    });

    // Iniciar búsqueda de conductores DESPUÉS de responder
    // Delay de 2s para que el frontend monte los socket listeners
    setTimeout(async () => {
      console.log('🔍 Iniciando búsqueda de conductores...');
      try {
        const searchResult = await rideQueueService.startSearch(ride);
        console.log('   Resultado búsqueda:', searchResult);
      } catch (queueError) {
        console.error('❌ Error starting driver search queue:', queueError);
      }
    }, 2000);

    return; // Ya enviamos la respuesta
  } catch (error) {
    console.error("Error al crear viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear solicitud de viaje",
      error: error.message,
    });
  }
};

// @desc    Obtener viajes del usuario
// @route   GET /api/rides
// @access  Private
export const getUserRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = supabaseAdmin
      .from('rides')
      .select('*, driver:driver_id(id, nombre, apellido, avatar)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rides, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: rides.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      rides: rides.map(formatRide),
    });
  } catch (error) {
    console.error("Error al obtener viajes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener viajes",
      error: error.message,
    });
  }
};

// @desc    Obtener un viaje específico
// @route   GET /api/rides/:id
// @access  Private
export const getRideById = async (req, res) => {
  try {
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .select('*, driver:driver_id(id, nombre, apellido, avatar, telefono_numero)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !ride) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    res.json({
      success: true,
      ride: formatRide(ride),
    });
  } catch (error) {
    console.error("Error al obtener viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener viaje",
      error: error.message,
    });
  }
};

// @desc    Cancelar un viaje
// @route   PUT /api/rides/:id/cancel
// @access  Private
export const cancelRide = async (req, res) => {
  try {
    const rideId = req.params.id;

    // Primero verificar que el viaje existe y pertenece al usuario
    const { data: existingRide, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingRide) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    if (existingRide.status === "completed" || existingRide.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un viaje ${existingRide.status}`,
      });
    }

    // Cancelar búsqueda en la cola si está activa
    await rideQueueService.cancelSearch(rideId, 'user_cancelled');

    const cancellationReason = req.body.reason || 'user_cancelled';

    // Actualizar estado (motivo en notes: columna cancellation_reason puede no existir)
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .update({
        status: 'cancelled',
        notes: appendCancellationToNotes(existingRide.notes, cancellationReason),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (error) throw error;

    emitToUser(existingRide.user_id, 'ride:status_changed', {
      rideId: ride.id,
      auxilioId: ride.id,
      status: 'cancelled',
    });
    emitToUser(existingRide.user_id, 'auxilio:status_changed', {
      rideId: ride.id,
      auxilioId: ride.id,
      status: 'cancelled',
    });

    // Si había un conductor asignado, notificarle
    if (existingRide.driver_id) {
      try {
        await notificationService.sendRideCancelled(
          existingRide,
          'user',
          req.body.reason
        );
        emitToUser(existingRide.driver_id, 'ride:cancelled', {
          rideId: ride.id,
          cancelledBy: 'user',
          reason: req.body.reason,
        });
      } catch (notifError) {
        console.error('Error sending cancellation notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: "Viaje cancelado",
      ride: formatRide(ride),
    });
  } catch (error) {
    console.error("Error al cancelar viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar viaje",
      error: error.message,
    });
  }
};

// ===========================================
// ENDPOINTS PARA CONDUCTORES
// ===========================================

// @desc    Obtener viajes disponibles para conductores
// @route   GET /api/rides/available
// @access  Private (Driver)
export const getAvailableRides = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius en km

    // Obtener viajes pendientes
    let query = supabaseAdmin
      .from('rides')
      .select('*, user:user_id(id, nombre, apellido, avatar)')
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: rides, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: rides.length,
      rides: rides.map(formatRide),
    });
  } catch (error) {
    console.error("Error al obtener viajes disponibles:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener viajes disponibles",
      error: error.message,
    });
  }
};

// @desc    Aceptar un viaje (conductor)
// @route   PUT /api/rides/:id/accept
// @access  Private (Driver)
export const acceptRide = async (req, res) => {
  try {
    const { vehicleId, etaMinutes } = req.body;
    const rideId = req.params.id;
    const driverId = req.user.id;

    // Primero verificar en el sistema de cola si este conductor puede aceptar
    const queueResult = await rideQueueService.handleDriverAccept(rideId, driverId);

    if (!queueResult.success) {
      return res.status(400).json({
        success: false,
        message: queueResult.message,
      });
    }

    // Verificar que el viaje existe y está pendiente
    const { data: existingRide, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('status', 'pending')
      .is('driver_id', null)
      .single();

    if (fetchError || !existingRide) {
      return res.status(404).json({
        success: false,
        message: "Viaje no disponible o ya asignado",
      });
    }

    const parsedEta = Number(etaMinutes);
    const resolvedEta =
      Number.isFinite(parsedEta) && parsedEta >= 1 ? Math.round(parsedEta) : 30;

    let notesWithEta = setEtaMinutes(existingRide.notes, resolvedEta);
    notesWithEta = appendTimelineEvent(notesWithEta, 'accepted', {
      driverId,
      etaMinutes: resolvedEta,
    });

    // Asignar conductor al viaje
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .update({
        driver_id: driverId,
        vehicle_id: vehicleId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        notes: notesWithEta,
      })
      .eq('id', rideId)
      .select('*, user:user_id(id, nombre, apellido, avatar, telefono_numero, email)')
      .single();

    if (error) throw error;

    // Obtener info del conductor para notificación
    const { data: driver } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average, telefono_numero')
      .eq('id', driverId)
      .single();

    // Obtener info del vehículo si se proporcionó vehicleId
    let vehicleInfo = null;
    if (vehicleId) {
      const { data: vehicle } = await supabaseAdmin
        .from('vehicles')
        .select('id, brand, model, year, color, plate_number')
        .eq('id', vehicleId)
        .single();
      vehicleInfo = vehicle;
    }

    const rideMeta = parseRideNotes(ride.notes);
    const etaForClient = rideMeta.etaMinutes ?? resolvedEta;

    // Notificar al usuario que el viaje fue aceptado
    try {
      await notificationService.sendRideAccepted(
        { ...ride, eta: etaForClient },
        driver
      );

      const acceptedPayload = {
        rideId: ride.id,
        auxilioId: ride.id,
        driver: {
          id: driver.id,
          nombre: driver.nombre,
          apellido: driver.apellido,
          avatar: driver.avatar,
          rating: driver.rating_average,
          telefono_numero: driver.telefono_numero,
        },
        vehicle: vehicleInfo ? {
          id: vehicleInfo.id,
          brand: vehicleInfo.brand,
          model: vehicleInfo.model,
          year: vehicleInfo.year,
          color: vehicleInfo.color,
          plate: vehicleInfo.plate_number,
        } : null,
        passenger: ride.user ? {
          id: ride.user.id,
          nombre: ride.user.nombre,
          apellido: ride.user.apellido,
          avatar: ride.user.avatar,
          telefono_numero: ride.user.telefono_numero,
          email: ride.user.email,
        } : null,
        eta: etaForClient,
        etaMinutes: etaForClient,
      };

      emitToUser(ride.user_id, 'ride:accepted', acceptedPayload);

      if (ride.service_type === 'auxilio') {
        emitToUser(ride.user_id, 'auxilio:status_changed', {
          ...acceptedPayload,
          status: 'asignado',
          riverStatus: 'asignado',
        });
      }
    } catch (notifError) {
      console.error('Error sending ride accepted notification:', notifError);
    }

    res.json({
      success: true,
      message: "Viaje aceptado",
      ride: formatRide(ride),
    });
  } catch (error) {
    console.error("Error al aceptar viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al aceptar viaje",
      error: error.message,
    });
  }
};

// @desc    Rechazar un viaje (conductor)
// @route   PUT /api/rides/:id/reject
// @access  Private (Driver)
export const rejectRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const driverId = req.user.id;

    // Notificar al sistema de cola que el conductor rechazó
    await rideQueueService.handleDriverReject(rideId, driverId);

    res.json({
      success: true,
      message: "Viaje rechazado",
    });
  } catch (error) {
    console.error("Error al rechazar viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al rechazar viaje",
      error: error.message,
    });
  }
};

// @desc    Obtener estado de la cola de búsqueda
// @route   GET /api/rides/:id/queue-status
// @access  Private
export const getQueueStatus = async (req, res) => {
  try {
    const rideId = req.params.id;
    const status = rideQueueService.getQueueStatus(rideId);

    if (!status) {
      return res.json({
        success: true,
        searching: false,
        message: "No hay búsqueda activa para este viaje",
      });
    }

    res.json({
      success: true,
      searching: true,
      ...status,
    });
  } catch (error) {
    console.error("Error al obtener estado de cola:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estado de cola",
      error: error.message,
    });
  }
};

// @desc    Actualizar estado del viaje (conductor)
// @route   PUT /api/rides/:id/status
// @access  Private (Driver)
export const updateRideStatus = async (req, res) => {
  try {
    const { status: rawStatus } = req.body;
    const validStatuses = [
      'arrived',
      'in_progress',
      'completed',
      'arribado',
      'zarpado',
      'en_proceso',
      'finalizado',
    ];

    if (!validStatuses.includes(rawStatus)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
      });
    }

    const status = mapRiverStatusToDb(rawStatus);
    const riverStatus = rawStatus === status ? mapDbStatusToRiver(status, null) : rawStatus;

    // Verificar que el viaje existe y pertenece al conductor
    const { data: existingRide, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', req.params.id)
      .eq('driver_id', req.user.id)
      .single();

    if (fetchError || !existingRide) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    const timelineEventMap = {
      arribado: 'arribado',
      zarpado: 'zarpado',
      en_proceso: 'en_proceso',
      finalizado: 'finalizado',
      arrived: 'arribado',
      in_progress: 'zarpado',
      completed: 'finalizado',
    };
    const timelineEvent = timelineEventMap[rawStatus] || rawStatus;
    let updatedNotes = appendTimelineEvent(existingRide.notes, timelineEvent, {
      driverId: req.user.id,
    });

    if (rawStatus === 'finalizado' || rawStatus === 'completed') {
      updatedNotes = appendTimelineEvent(updatedNotes, 'regreso', {
        driverId: req.user.id,
      });
    }

    // Preparar datos de actualización
    const updateData = { status, notes: updatedNotes };

    if (status === 'arrived' || rawStatus === 'arribado') {
      updateData.arrived_at = new Date().toISOString();
    } else if (status === 'in_progress' || rawStatus === 'zarpado') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed' || rawStatus === 'finalizado') {
      updateData.completed_at = new Date().toISOString();

      // Registrar ganancia del conductor
      try {
        let finalPrice = existingRide.estimated_price || 0;

        // Verificar si ya existe un payment para este ride
        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id, status, payment_method')
          .eq('ride_id', req.params.id)
          .single();

        // Si no hay payment o es pago en efectivo, registrar la ganancia
        const isCashPayment = !existingPayment || existingPayment.payment_method === 'cash';

        // Aplicar descuento por efectivo si corresponde
        if (isCashPayment) {
          const serviceType = existingRide.service_type?.replace('-', '_') || 'vuelta_segura';
          const discount = await priceRulesService.getCashDiscount(serviceType, finalPrice);
          if (discount) {
            finalPrice = discount.finalPrice;
            updateData.cash_discount_percentage = discount.percentage;
            updateData.cash_discount_amount = discount.discountAmount;
          }
        }

        updateData.actual_price = finalPrice;

        if (isCashPayment && finalPrice > 0) {
          // Crear registro de payment si no existe
          let paymentId = existingPayment?.id;

          if (!existingPayment) {
            const { data: newPayment } = await supabaseAdmin
              .from('payments')
              .insert({
                ride_id: req.params.id,
                user_id: existingRide.user_id,
                driver_id: req.user.id,
                amount: finalPrice,
                payment_method: 'cash',
                status: 'approved',
                paid_at: new Date().toISOString(),
                description: 'Pago en efectivo por viaje',
              })
              .select('id')
              .single();
            paymentId = newPayment?.id;
          } else if (existingPayment.status === 'pending') {
            // Actualizar payment existente a aprobado con precio descontado
            await supabaseAdmin
              .from('payments')
              .update({
                status: 'approved',
                amount: finalPrice,
                paid_at: new Date().toISOString(),
              })
              .eq('id', existingPayment.id);
          }

          // Registrar ganancia del conductor (sobre el monto descontado)
          await driverWalletService.addEarning({
            driverId: req.user.id,
            rideId: req.params.id,
            paymentId: paymentId,
            grossAmount: finalPrice,
            serviceType: existingRide.service_type?.replace('-', '_') || 'vuelta_segura',
            paymentMethod: 'cash',
          });

          console.log(`💰 Ganancia registrada para conductor ${req.user.id}: $${finalPrice}`);
        }
      } catch (earningError) {
        console.error('Error registrando ganancia del conductor:', earningError);
        // No fallar el request por esto, solo loguear
      }
    }

    // Actualizar estado
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, user:user_id(id, nombre, apellido, avatar)')
      .single();

    if (error) throw error;

    // Obtener info del conductor para notificaciones
    const { data: driver } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar')
      .eq('id', req.user.id)
      .single();

    // Enviar notificaciones según el estado
    try {
      if (status === 'arrived') {
        // Notificar al usuario que el conductor llegó
        await notificationService.sendDriverArrived(ride, driver);
        emitToUser(ride.user_id, 'ride:driver_arrived', {
          rideId: ride.id,
          driverName: `${driver.nombre} ${driver.apellido}`,
        });
      } else if (status === 'completed') {
        // Notificar al usuario que el viaje terminó
        await notificationService.sendRideCompleted(ride, ride.actual_price || ride.estimated_price);
        emitToUser(ride.user_id, 'ride:completed', {
          rideId: ride.id,
          actualPrice: ride.actual_price || ride.estimated_price,
          estimatedPrice: ride.estimated_price,
          cashDiscountPercentage: ride.cash_discount_percentage || 0,
          cashDiscountAmount: ride.cash_discount_amount || 0,
        });

        // Enviar recordatorio de calificación después de 5 minutos
        setTimeout(async () => {
          try {
            await notificationService.sendRatingReminder(
              ride.user_id,
              ride.id,
              driver.nombre
            );
          } catch (e) {
            console.error('Error sending rating reminder:', e);
          }
        }, 5 * 60 * 1000);
      }

      const statusPayload = {
        rideId: ride.id,
        auxilioId: ride.id,
        status,
        riverStatus: riverStatus || mapDbStatusToRiver(status, ride.notes),
        timestamp: new Date().toISOString(),
      };

      emitToRide(ride.id, 'ride:status_changed', statusPayload);

      if (ride.service_type === 'auxilio') {
        emitToUser(ride.user_id, 'auxilio:status_changed', statusPayload);
      }
    } catch (notifError) {
      console.error('Error sending status notification:', notifError);
    }

    // Incluir payment_method en la respuesta cuando se completa
    const responseData = {
      success: true,
      message: `Viaje actualizado a ${status}`,
      ride: formatRide(ride),
    };

    if (status === 'completed') {
      const { data: paymentInfo } = await supabaseAdmin
        .from('payments')
        .select('payment_method')
        .eq('ride_id', req.params.id)
        .single();
      responseData.paymentMethod = paymentInfo?.payment_method || 'cash';
    }

    res.json(responseData);
  } catch (error) {
    console.error("Error al actualizar estado del viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado del viaje",
      error: error.message,
    });
  }
};

// @desc    Obtener viajes del conductor
// @route   GET /api/rides/driver
// @access  Private (Driver)
export const getDriverRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = supabaseAdmin
      .from('rides')
      .select('*, user:user_id(id, nombre, apellido, avatar)', { count: 'exact' })
      .eq('driver_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rides, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: rides.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      rides: rides.map(formatRide),
    });
  } catch (error) {
    console.error("Error al obtener viajes del conductor:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener viajes del conductor",
      error: error.message,
    });
  }
};

// @desc    Cancelar viaje como conductor
// @route   PUT /api/rides/:id/driver-cancel
// @access  Private (Driver)
export const driverCancelRide = async (req, res) => {
  try {
    const { reason } = req.body;

    // Verificar que el viaje existe y pertenece al conductor
    const { data: existingRide, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', req.params.id)
      .eq('driver_id', req.user.id)
      .single();

    if (fetchError || !existingRide) {
      return res.status(404).json({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    if (existingRide.status === "completed" || existingRide.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un viaje ${existingRide.status}`,
      });
    }

    // Volver el viaje a estado pendiente sin conductor
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .update({
        driver_id: null,
        vehicle_id: null,
        status: 'pending',
        driver_cancel_reason: reason,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Notificar al usuario que el conductor canceló
    try {
      await notificationService.sendRideCancelled(
        existingRide,
        'driver',
        reason
      );
      emitToUser(existingRide.user_id, 'ride:cancelled', {
        rideId: ride.id,
        cancelledBy: 'driver',
        reason,
      });

      // Notificar a otros conductores que hay un viaje disponible nuevamente
      emitToAvailableDrivers('ride:new_request', {
        rideId: ride.id,
        pickup: { address: ride.pickup_address },
        dropoff: { address: ride.dropoff_address },
        estimatedPrice: ride.estimated_price,
      });
    } catch (notifError) {
      console.error('Error sending driver cancel notification:', notifError);
    }

    res.json({
      success: true,
      message: "Viaje cancelado por conductor",
      ride: formatRide(ride),
    });
  } catch (error) {
    console.error("Error al cancelar viaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar viaje",
      error: error.message,
    });
  }
};

// Helper para formatear respuesta de viaje
function formatRide(ride) {
  return {
    id: ride.id,
    userId: ride.user_id,
    // Incluir datos del usuario si están disponibles (para el conductor)
    user: ride.user ? {
      id: ride.user.id,
      nombre: ride.user.nombre,
      apellido: ride.user.apellido,
      avatar: ride.user.avatar,
      telefono_numero: ride.user.telefono_numero,
    } : null,
    serviceType: ride.service_type,
    pickup: {
      address: ride.pickup_address,
      coordinates: {
        lat: parseFloat(ride.pickup_lat),
        lng: parseFloat(ride.pickup_lng),
      },
    },
    dropoff: {
      address: ride.dropoff_address,
      coordinates: {
        lat: parseFloat(ride.dropoff_lat),
        lng: parseFloat(ride.dropoff_lng),
      },
    },
    scheduledDate: ride.scheduled_date,
    scheduledTime: {
      hour: ride.scheduled_hour,
      minute: ride.scheduled_minute,
    },
    status: ride.status,
    estimatedPrice: ride.estimated_price,
    actualPrice: ride.actual_price,
    cashDiscountPercentage: ride.cash_discount_percentage || 0,
    cashDiscountAmount: ride.cash_discount_amount || 0,
    distance: ride.distance,
    duration: ride.duration,
    // Incluir datos del conductor si están disponibles (para el usuario)
    driver: ride.driver ? {
      id: ride.driver.id,
      nombre: ride.driver.nombre,
      apellido: ride.driver.apellido,
      avatar: ride.driver.avatar,
      telefono_numero: ride.driver.telefono_numero,
    } : null,
    cancellationReason: readCancellationReason(ride),
    notes: ride.notes,
    createdAt: ride.created_at,
    updatedAt: ride.updated_at,
  };
}
