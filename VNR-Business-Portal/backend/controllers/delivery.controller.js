import { supabaseAdmin } from "../config/supabase.js";
import { emitToDriver, emitToAvailableDrivers, emitToUser } from "../config/socket.js";
import notificationService from "../services/notification.service.js";
import driverWalletService from "../services/driverWallet.service.js";
import priceRulesService from "../services/priceRules.service.js";
import { estimatePrice } from "../services/pricing.service.js";
import { generateDeliveryCode } from "../utils/deliveryCode.js";

// Helper para guardar ubicación en historial del usuario
async function saveLocationToHistory(userId, address, coordinates, locationType = 'both') {
  // Verificar si la ubicación ya existe
  const { data: existing } = await supabaseAdmin
    .from('saved_locations')
    .select('id, usage_count')
    .eq('user_id', userId)
    .eq('address', address)
    .single();

  if (existing) {
    // Actualizar uso si ya existe
    await supabaseAdmin
      .from('saved_locations')
      .update({
        usage_count: (existing.usage_count || 0) + 1,
        last_used: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Crear nueva ubicación
    await supabaseAdmin
      .from('saved_locations')
      .insert({
        user_id: userId,
        address: address,
        formatted_address: address,
        lat: coordinates.lat || coordinates.latitude,
        lng: coordinates.lng || coordinates.longitude,
        location_type: locationType,
        last_used: new Date().toISOString(),
        usage_count: 1,
      });
  }
}

// Helper para calcular distancia entre dos puntos (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// @desc    Crear una solicitud de envío
// @route   POST /api/deliveries
// @access  Private
export const createDelivery = async (req, res) => {
  try {
    const {
      serviceType,
      deliveryType,
      pickup,
      dropoff,
      scheduledDate,
      scheduledTime,
      packageDetails,
      notes,
      estimatedPrice,
      distance,
      paymentMethod,
    } = req.body;

    // Validar datos requeridos
    if (!pickup?.address || !dropoff?.address) {
      return res.status(400).json({
        success: false,
        message: "Se requiere dirección de origen y destino",
      });
    }

    // PRECIO AUTORITATIVO: recalcular desde las tarifas del CRM (service_rates)
    // en vez de confiar en el precio de la app. Solo para ENVÍO (base+km simple).
    // Los FLETES llevan multiplicador de vehículo + ayudantes (no viven en
    // service_rates), así que se respeta el precio que arma la app.
    const stype = serviceType || 'envio';
    let finalPrice = estimatedPrice;
    if (!String(stype).includes('flete')) {
      const est = await estimatePrice({ serviceType: stype, distanceKm: Number(distance) || 0 });
      finalPrice = est.price;
    }

    // Obtener datos del usuario
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average')
      .eq('id', req.user.id)
      .single();

    // Crear el envío en Supabase
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .insert({
        user_id: req.user.id,
        service_type: serviceType || "envio",
        delivery_type: deliveryType || "enviar",
        pickup_address: pickup.address,
        pickup_lat: pickup.coordinates?.lat,
        pickup_lng: pickup.coordinates?.lng,
        pickup_contact_name: pickup.contactName,
        pickup_contact_phone: pickup.contactPhone,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.coordinates?.lat,
        dropoff_lng: dropoff.coordinates?.lng,
        dropoff_contact_name: dropoff.contactName,
        dropoff_contact_phone: dropoff.contactPhone,
        scheduled_date: scheduledDate,
        scheduled_hour: scheduledTime?.hour,
        scheduled_minute: scheduledTime?.minute,
        package_description: packageDetails?.description,
        package_weight: packageDetails?.weight,
        package_length: packageDetails?.dimensions?.length,
        package_width: packageDetails?.dimensions?.width,
        package_height: packageDetails?.dimensions?.height,
        package_is_fragile: packageDetails?.isFragile || false,
        helpers_count: packageDetails?.helpers || 0,
        vehicle_type: packageDetails?.vehicleType || null,
        estimated_price: finalPrice,
        distance,
        notes,
        delivery_code: generateDeliveryCode(),
      })
      .select()
      .single();

    if (error) throw error;

    // Guardar las ubicaciones en el historial (silently - no debe fallar el envío)
    try {
      if (pickup.coordinates) {
        await saveLocationToHistory(req.user.id, pickup.address, pickup.coordinates, 'pickup');
      }
      if (dropoff.coordinates) {
        await saveLocationToHistory(req.user.id, dropoff.address, dropoff.coordinates, 'dropoff');
      }
    } catch (locationError) {
      console.log('Error guardando ubicaciones en historial:', locationError.message);
      // No fallar el envío por esto
    }

    // Si el método de pago no es efectivo, crear payment pendiente
    // para que el driver vea "Pago en progreso" al completar
    if (paymentMethod && paymentMethod !== 'cash') {
      try {
        await supabaseAdmin.from('payments').insert({
          delivery_id: delivery.id,
          user_id: req.user.id,
          amount: finalPrice,
          payment_method: paymentMethod,
          status: 'pending',
          description: `Pago pendiente por envío`,
        });
      } catch (paymentErr) {
        console.log('Error creando payment pendiente:', paymentErr.message);
      }
    }

    // Notificar a conductores cercanos disponibles
    await notifyNearbyDrivers(delivery, userData, pickup.coordinates);

    res.status(201).json({
      success: true,
      message: "Solicitud de envío creada exitosamente",
      delivery: formatDelivery(delivery, { includeCode: true }),
    });
  } catch (error) {
    console.error("Error al crear envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear solicitud de envío",
      error: error.message,
    });
  }
};

// Helper para notificar a conductores cercanos
// Fallback de matching: cuando un cadete se pone disponible, re-ofrecerle los
// envíos PENDIENTES sin asignar que estén cerca. Cubre el caso en que un pedido
// se creó cuando no había ningún cadete online (antes quedaba colgado en pending).
export async function notifyDriverOfPendingDeliveries(driverId, activeServiceType, driverLat, driverLng) {
  try {
    const typeToServices = {
      cadete: ['envio', 'envio_express'],
      fletes: ['flete', 'fletes'],
    };
    const serviceTypes = typeToServices[activeServiceType];
    if (!serviceTypes) return;

    const { data: pending } = await supabaseAdmin
      .from('deliveries')
      .select('*, user:user_id(id, nombre, apellido, avatar, rating_average)')
      .eq('status', 'pending')
      .is('driver_id', null)
      .in('service_type', serviceTypes)
      .order('created_at', { ascending: true })
      .limit(20);

    if (!pending || pending.length === 0) return;

    const radius = 10; // km
    let count = 0;
    for (const d of pending) {
      if (driverLat && driverLng && d.pickup_lat && d.pickup_lng) {
        const dist = calculateDistance(driverLat, driverLng, d.pickup_lat, d.pickup_lng);
        if (dist > radius) continue;
      }
      emitToDriver(driverId, 'delivery:new_request', {
        deliveryId: d.id,
        serviceType: d.service_type,
        pickup: { address: d.pickup_address, lat: d.pickup_lat, lng: d.pickup_lng },
        dropoff: { address: d.dropoff_address, lat: d.dropoff_lat, lng: d.dropoff_lng },
        estimatedPrice: d.estimated_price,
        distance: d.distance,
        packageDescription: d.package_description,
        helpers: d.helpers_count || 0,
        vehicleType: d.vehicle_type,
        user: d.user ? {
          id: d.user.id, nombre: d.user.nombre, apellido: d.user.apellido,
          avatar: d.user.avatar, rating: d.user.rating_average,
        } : null,
        requestedAt: new Date().toISOString(),
        rebroadcast: true,
      });
      count++;
      if (count >= 5) break; // no saturar al cadete
    }
    if (count > 0) console.log(`🔁 Re-ofrecidos ${count} envío(s) pendiente(s) al cadete ${driverId}`);
  } catch (e) {
    console.error('Error notifyDriverOfPendingDeliveries:', e);
  }
}

export async function notifyNearbyDrivers(delivery, user, pickupCoords, excludeDriverId = null) {
  try {
    // Mapear tipo de servicio de envío al tipo de conductor requerido
    const serviceToDriverType = {
      'envio': 'cadete',
      'envio_express': 'cadete',
      'flete': 'fletes',
      'fletes': 'fletes',
    };
    const requiredDriverType = serviceToDriverType[delivery.service_type] || 'cadete';

    // Obtener conductores disponibles con su perfil para filtrar por estado
    const { data: availableDrivers, error } = await supabaseAdmin
      .from('driver_availability')
      .select('driver_id, current_latitude, current_longitude, current_vehicle_id, active_service_type, profiles:driver_id(driver_status, is_driver)')
      .eq('is_available', true);

    if (error) {
      console.error('Error getting available drivers:', error);
      return;
    }

    if (!availableDrivers || availableDrivers.length === 0) {
      console.log('📭 No hay conductores disponibles para notificar');
      return;
    }

    // Filtrar por active_service_type y estado activo
    const typeFilteredDrivers = availableDrivers.filter(d => {
      const profile = d.profiles;
      if (excludeDriverId && d.driver_id === excludeDriverId) return false; // no re-ofrecer al que canceló
      if (!profile?.is_driver) return false;
      if (profile.driver_status !== 'active') return false;
      if (d.active_service_type !== requiredDriverType) return false;
      return true;
    });

    console.log(`📦 Conductores con servicio activo ${requiredDriverType}: ${typeFilteredDrivers.length} de ${availableDrivers.length} disponibles`);

    // Radio de búsqueda en km (10km por defecto)
    const searchRadius = 10;

    // Filtrar conductores por distancia si tenemos coordenadas de pickup
    let driversToNotify = typeFilteredDrivers;

    if (pickupCoords?.lat && pickupCoords?.lng) {
      driversToNotify = typeFilteredDrivers.filter(driver => {
        if (!driver.current_latitude || !driver.current_longitude) {
          return true; // Incluir si no tiene ubicación (por si acaso)
        }
        const dist = calculateDistance(
          pickupCoords.lat,
          pickupCoords.lng,
          driver.current_latitude,
          driver.current_longitude
        );
        return dist <= searchRadius;
      });
    }

    console.log(`📦 Notificando ${driversToNotify.length} conductores sobre nuevo envío`);

    // Preparar datos del envío para notificar
    const deliveryNotification = {
      deliveryId: delivery.id,
      serviceType: delivery.service_type,
      pickup: {
        address: delivery.pickup_address,
        lat: delivery.pickup_lat,
        lng: delivery.pickup_lng,
      },
      dropoff: {
        address: delivery.dropoff_address,
        lat: delivery.dropoff_lat,
        lng: delivery.dropoff_lng,
      },
      estimatedPrice: delivery.estimated_price,
      distance: delivery.distance,
      packageDescription: delivery.package_description,
      packageWeight: delivery.package_weight,
      packageDimensions: {
        height: delivery.package_height,
        width: delivery.package_width,
        depth: delivery.package_length, // length = depth/profundidad
      },
      helpers: delivery.helpers_count || 0,
      vehicleType: delivery.vehicle_type,
      user: user ? {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        avatar: user.avatar,
        rating: user.rating_average,
      } : null,
      requestedAt: new Date().toISOString(),
    };

    // Notificar solo a conductores del tipo correcto y cercanos
    for (const driver of driversToNotify) {
      emitToDriver(driver.driver_id, 'delivery:new_request', deliveryNotification);
    }

    // Enviar notificaciones push a los conductores
    const driverIds = driversToNotify.map(d => d.driver_id);
    if (driverIds.length > 0) {
      await notificationService.sendToMultipleUsers(driverIds, {
        type: 'new_delivery_available',
        title: 'Nuevo envío disponible',
        body: `Envío a ${delivery.dropoff_address?.split(',')[0]}. $${delivery.estimated_price}`,
        data: {
          deliveryId: delivery.id,
          screen: 'DeliveryRequest',
          pickupAddress: delivery.pickup_address,
          dropoffAddress: delivery.dropoff_address,
          estimatedPrice: delivery.estimated_price,
        },
        sound: 'new_ride.wav',
        priority: 'high',
      });
    }

  } catch (err) {
    console.error('Error notifying drivers:', err);
  }
}

// @desc    Obtener envíos del usuario
// @route   GET /api/deliveries
// @access  Private
export const getUserDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const serviceType = req.query.serviceType;

    let query = supabaseAdmin
      .from('deliveries')
      .select('*, driver:driver_id(id, nombre, apellido, avatar)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data: deliveries, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: deliveries.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      deliveries: deliveries.map(formatDelivery),
    });
  } catch (error) {
    console.error("Error al obtener envíos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener envíos",
      error: error.message,
    });
  }
};

// @desc    Obtener un envío específico
// @route   GET /api/deliveries/:id
// @access  Private (Usuario o Conductor asignado)
export const getDeliveryById = async (req, res) => {
  try {
    // Primero obtener el delivery sin filtrar por usuario para poder verificar permisos
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select('*, driver:driver_id(id, nombre, apellido, avatar, telefono_numero, rating_average)')
      .eq('id', req.params.id)
      .single();

    if (error || !delivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado",
      });
    }

    // Verificar que el usuario es el dueño o el conductor asignado
    const isOwner = delivery.user_id === req.user.id;
    const isDriver = delivery.driver_id === req.user.id;

    if (!isOwner && !isDriver) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para ver este envío",
      });
    }

    // Obtener información del vehículo si hay conductor asignado
    let vehicleInfo = null;
    if (delivery.driver_id) {
      const { data: vehicle } = await supabaseAdmin
        .from('vehicles')
        .select('id, brand, model, color, plate_number, vehicle_type')
        .eq('driver_id', delivery.driver_id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (vehicle) {
        vehicleInfo = {
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          plate: vehicle.plate_number,
          type: vehicle.vehicle_type,
        };
      }
    }

    // Formatear respuesta con info adicional. El código de entrega (PIN) solo
    // se expone al dueño del envío, nunca al cadete (que lo recibe de quien recibe).
    const formattedDelivery = formatDelivery(delivery, { includeCode: isOwner });

    // Agregar información del conductor formateada para el frontend
    if (delivery.driver) {
      formattedDelivery.driverInfo = {
        id: delivery.driver.id,
        name: `${delivery.driver.nombre || ''} ${delivery.driver.apellido || ''}`.trim() || 'Conductor',
        avatar: delivery.driver.avatar,
        phone: delivery.driver.telefono_numero,
        rating: delivery.driver.rating_average || 5.0,
        vehicle: vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : null,
        vehicleColor: vehicleInfo?.color,
        plate: vehicleInfo?.plate,
      };
    }

    res.json({
      success: true,
      delivery: formattedDelivery,
    });
  } catch (error) {
    console.error("Error al obtener envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener envío",
      error: error.message,
    });
  }
};

// @desc    Rastrear envío por número de tracking
// @route   GET /api/deliveries/track/:trackingNumber
// @access  Public
export const trackDelivery = async (req, res) => {
  try {
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select('tracking_number, status, pickup_address, dropoff_address, scheduled_date, created_at, updated_at, driver:driver_id(nombre, apellido)')
      .eq('tracking_number', req.params.trackingNumber)
      .single();

    if (error || !delivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado",
      });
    }

    res.json({
      success: true,
      tracking: {
        trackingNumber: delivery.tracking_number,
        status: delivery.status,
        pickup: delivery.pickup_address,
        dropoff: delivery.dropoff_address,
        scheduledDate: delivery.scheduled_date,
        createdAt: delivery.created_at,
        updatedAt: delivery.updated_at,
      },
    });
  } catch (error) {
    console.error("Error al rastrear envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al rastrear envío",
      error: error.message,
    });
  }
};

// @desc    Cancelar un envío
// @route   PUT /api/deliveries/:id/cancel
// @access  Private
export const cancelDelivery = async (req, res) => {
  try {
    const { data: existingDelivery, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingDelivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado",
      });
    }

    if (existingDelivery.status === "delivered" || existingDelivery.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un envío ${existingDelivery.status}`,
      });
    }

    const { reason } = req.body;

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update({
        status: 'cancelled',
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Si había un conductor asignado, notificarle de la cancelación
    if (existingDelivery.driver_id) {
      // Emitir evento WebSocket al conductor para actualizar su pantalla inmediatamente
      emitToDriver(existingDelivery.driver_id, 'delivery:user_cancelled', {
        deliveryId: req.params.id,
        status: 'cancelled',
        reason: reason || 'El usuario canceló el envío',
        cancelledBy: 'user',
        timestamp: new Date().toISOString(),
      });

      // También emitir delivery:status_changed para compatibilidad
      emitToDriver(existingDelivery.driver_id, 'delivery:status_changed', {
        deliveryId: req.params.id,
        status: 'cancelled',
        reason: reason || 'El usuario canceló el envío',
        cancelledBy: 'user',
        timestamp: new Date().toISOString(),
      });

      // Enviar push notification como backup
      await notificationService.sendToUser(existingDelivery.driver_id, {
        type: 'delivery_cancelled',
        title: 'Envío cancelado',
        body: reason || 'El usuario canceló el envío.',
        data: {
          deliveryId: req.params.id,
          cancelledBy: 'user',
        },
      });

      console.log(`❌ Envío ${req.params.id} cancelado por usuario, notificando a conductor ${existingDelivery.driver_id}`);
    }

    res.json({
      success: true,
      message: "Envío cancelado",
      delivery: formatDelivery(delivery),
    });
  } catch (error) {
    console.error("Error al cancelar envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar envío",
      error: error.message,
    });
  }
};

// ===========================================
// ENDPOINTS PARA CADETES (CONDUCTORES DE ENVÍOS)
// ===========================================

// @desc    Obtener envíos disponibles para cadetes
// @route   GET /api/deliveries/cadete/available
// @access  Private (Cadete)
export const getAvailableDeliveries = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    // Obtener envíos pendientes
    const { data: deliveries, error } = await supabaseAdmin
      .from('deliveries')
      .select('*, user:user_id(id, nombre, apellido, avatar)')
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      count: deliveries.length,
      deliveries: deliveries.map(formatDelivery),
    });
  } catch (error) {
    console.error("Error al obtener envíos disponibles:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener envíos disponibles",
      error: error.message,
    });
  }
};

// @desc    Aceptar un envío (cadete)
// @route   PUT /api/deliveries/:id/accept
// @access  Private (Cadete)
export const acceptDelivery = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    // Verificar que el envío existe y está pendiente
    const { data: existingDelivery, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .is('driver_id', null)
      .single();

    if (fetchError || !existingDelivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no disponible o ya asignado",
      });
    }

    // Asignar cadete al envío
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update({
        driver_id: req.user.id,
        status: 'confirmed',
      })
      .eq('id', req.params.id)
      .select('*, user:user_id(id, nombre, apellido, avatar, telefono_numero)')
      .single();

    if (error) throw error;

    // Obtener datos del conductor para notificar al usuario
    const { data: driverProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average, telefono_numero')
      .eq('id', req.user.id)
      .single();

    console.log('🚗 vehicleId recibido:', vehicleId);

    // Obtener datos del vehículo si se especificó
    let vehicleInfo = null;
    if (vehicleId) {
      const { data: vehicle, error: vehicleError } = await supabaseAdmin
        .from('driver_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      console.log('🚗 Vehicle data:', vehicle, 'Error:', vehicleError);

      if (vehicle) {
        vehicleInfo = {
          brand: vehicle.brand,
          model: vehicle.model,
          plate: vehicle.plate_number,
          color: vehicle.color,
        };
      }
    }

    // Formatear info del conductor para el frontend
    const driverInfo = {
      id: driverProfile?.id || req.user.id,
      name: `${driverProfile?.nombre || ''} ${driverProfile?.apellido || ''}`.trim(),
      nombre: driverProfile?.nombre,
      apellido: driverProfile?.apellido,
      avatar: driverProfile?.avatar,
      rating: driverProfile?.rating_average || 5.0,
      phone: driverProfile?.telefono_numero,
      vehicle: vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : 'Vehículo',
      plate: vehicleInfo?.plate || '---',
      vehicleColor: vehicleInfo?.color,
    };

    // Emitir evento al usuario para notificarle que su envío fue aceptado
    emitToUser(existingDelivery.user_id, 'delivery:accepted', {
      deliveryId: req.params.id,
      driver: driverInfo,
      status: 'confirmed',
      acceptedAt: new Date().toISOString(),
    });

    // Notificar a otros conductores que el envío ya no está disponible
    emitToAvailableDrivers('delivery:taken', { deliveryId: req.params.id });

    // Enviar notificación push al usuario
    await notificationService.sendToUser(existingDelivery.user_id, {
      type: 'delivery_accepted',
      title: 'Envío confirmado!',
      body: `${driverInfo.name} está en camino a retirar tu paquete.`,
      data: {
        deliveryId: req.params.id,
        driverId: req.user.id,
        screen: 'DeliveryTracking',
      },
    });

    console.log(`📦 Envío ${req.params.id} aceptado por ${driverProfile?.nombre || 'conductor'}`);

    res.json({
      success: true,
      message: "Envío aceptado",
      delivery: formatDelivery(delivery),
    });
  } catch (error) {
    console.error("Error al aceptar envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al aceptar envío",
      error: error.message,
    });
  }
};

// @desc    Actualizar estado del envío (cadete)
// @route   PUT /api/deliveries/:id/status
// @access  Private (Cadete)
// Liquida un envío de COMERCIO al entregarse: crea el cargo al comercio
// (business_charges) y acredita la ganancia al cadete. Idempotente.
async function settleBusinessDelivery(delivery, deliveryId, driverId, chargeAmount) {
  if (!chargeAmount || chargeAmount <= 0) return;

  // Idempotencia: no duplicar el cargo
  const { data: existingCharge } = await supabaseAdmin
    .from('business_charges')
    .select('id')
    .eq('delivery_id', deliveryId)
    .maybeSingle();
  if (existingCharge) return;

  // Comisión vigente para 'envio' (fallback 20% plataforma)
  let platformPct = 20;
  const { data: comm } = await supabaseAdmin
    .from('commission_settings')
    .select('platform_percentage')
    .eq('service_type', 'envio')
    .eq('is_active', true)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (comm?.platform_percentage != null) platformPct = comm.platform_percentage;

  const platformFee = Math.round((chargeAmount * platformPct) / 100);
  const driverAmount = chargeAmount - platformFee;

  await supabaseAdmin.from('business_charges').insert({
    business_id: delivery.business_id,
    delivery_id: deliveryId,
    amount: chargeAmount,
    platform_fee: platformFee,
    driver_amount: driverAmount,
    status: 'pending',
  });
  console.log(`💰 Cargo a comercio ${delivery.business_id}: $${chargeAmount} (envío ${deliveryId})`);

  // Acreditar al cadete (idempotente sobre driver_earnings)
  const { data: existingEarning } = await supabaseAdmin
    .from('driver_earnings')
    .select('id')
    .eq('delivery_id', deliveryId)
    .maybeSingle();
  if (!existingEarning) {
    await driverWalletService.addEarning({
      driverId,
      deliveryId,
      grossAmount: chargeAmount,
      serviceType: delivery.service_type || 'envio',
    });
    console.log(`💳 Ganancia acreditada al cadete ${driverId} (envío ${deliveryId})`);
  }
}

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff', 'delivered'];

    console.log(`📍 updateDeliveryStatus - ID: ${req.params.id}, Status: ${status}, User: ${req.user.id}`);

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido. Estados válidos: " + validStatuses.join(', '),
      });
    }

    // Verificar que el envío existe y pertenece al cadete
    const { data: existingDelivery, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', req.params.id)
      .eq('driver_id', req.user.id)
      .single();

    console.log(`📍 Delivery found:`, existingDelivery ? 'Yes' : 'No', 'Error:', fetchError?.message);

    if (fetchError || !existingDelivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado o no asignado a este conductor",
      });
    }

    // Validar el código de entrega al marcar como entregado. Quien recibe el
    // paquete le dicta el PIN al cadete; sin el código correcto no se cierra.
    // (Si el envío no tiene código — envíos viejos previos a esta feature — no se exige.)
    if (status === 'delivered' && existingDelivery.delivery_code) {
      const code = String(req.body.code ?? req.body.deliveryCode ?? '').trim();
      if (code !== String(existingDelivery.delivery_code)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_DELIVERY_CODE',
          message: 'Código de entrega incorrecto',
        });
      }
    }

    // Preparar datos de actualización
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Solo agregar actual_price cuando se entrega
    if (status === 'delivered') {
      // Registrar ganancia del conductor
      try {
        let finalPrice = existingDelivery.estimated_price || 0;

        // === Envío de COMERCIO: facturar al comercio + acreditar al cadete ===
        if (existingDelivery.business_id) {
          updateData.actual_price = finalPrice;
          await settleBusinessDelivery(existingDelivery, req.params.id, req.user.id, finalPrice);
        } else {
        // Verificar si ya existe un payment para este delivery
        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id, status, payment_method')
          .eq('delivery_id', req.params.id)
          .single();

        // Si no hay payment o es pago en efectivo, registrar la ganancia
        const isCashPayment = !existingPayment || existingPayment.payment_method === 'cash';

        // Aplicar descuento por efectivo si corresponde
        if (isCashPayment) {
          const serviceType = existingDelivery.service_type?.replace('-', '_') || 'envios';
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
                delivery_id: req.params.id,
                user_id: existingDelivery.user_id,
                driver_id: req.user.id,
                amount: finalPrice,
                payment_method: 'cash',
                status: 'approved',
                paid_at: new Date().toISOString(),
                description: 'Pago en efectivo por envío',
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
            deliveryId: req.params.id,
            paymentId: paymentId,
            grossAmount: finalPrice,
            serviceType: existingDelivery.service_type?.replace('-', '_') || 'envios',
            paymentMethod: 'cash',
          });

          console.log(`💰 Ganancia registrada para conductor ${req.user.id}: $${finalPrice}`);
        }
        } // fin else (envío de usuario)
      } catch (earningError) {
        console.error('Error registrando ganancia del conductor:', earningError);
        // No fallar el request por esto, solo loguear
      }
    }

    // Actualizar estado
    console.log(`📍 Updating with data:`, updateData);
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, user:user_id(id, nombre, apellido, avatar)')
      .single();

    if (error) {
      console.error(`📍 Update error:`, error);
      throw error;
    }

    console.log(`📍 Update successful, new status: ${delivery.status}`);

    // Notificar al usuario del cambio de estado via WebSocket
    if (existingDelivery.user_id) {
      emitToUser(existingDelivery.user_id, 'delivery:status_changed', {
        deliveryId: req.params.id,
        status: delivery.status,
        timestamp: new Date().toISOString(),
      });

      // Enviar notificación push según el estado
      const statusMessages = {
        arrived_pickup: {
          title: 'Conductor en punto de retiro',
          body: 'El conductor llegó a retirar tu paquete.',
        },
        picked_up: {
          title: 'Paquete retirado',
          body: 'Tu paquete fue retirado y está en camino.',
        },
        in_transit: {
          title: 'Envío en camino',
          body: 'Tu paquete está siendo llevado al destino.',
        },
        arrived_dropoff: {
          title: 'Conductor en destino',
          body: 'El conductor llegó al punto de entrega.',
        },
        delivered: {
          title: 'Envío entregado!',
          body: `Tu paquete fue entregado. Total: $${delivery.actual_price || delivery.estimated_price}`,
        },
      };

      const message = statusMessages[status];
      if (message) {
        await notificationService.sendToUser(existingDelivery.user_id, {
          type: `delivery_${status}`,
          title: message.title,
          body: message.body,
          data: {
            deliveryId: req.params.id,
            status,
            screen: status === 'delivered' ? 'RateRide' : 'DeliveryTracking',
          },
        });
      }
    }

    // Incluir payment_method en la respuesta cuando se marca como entregado
    const responseData = {
      success: true,
      message: `Envío actualizado a ${status}`,
      delivery: formatDelivery(delivery),
    };

    if (status === 'delivered') {
      // existingPayment ya fue consultado arriba
      const { data: paymentInfo } = await supabaseAdmin
        .from('payments')
        .select('payment_method')
        .eq('delivery_id', req.params.id)
        .single();
      responseData.paymentMethod = paymentInfo?.payment_method || 'cash';
    }

    res.json(responseData);
  } catch (error) {
    console.error("Error al actualizar estado del envío:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar estado del envío",
      error: error.message,
    });
  }
};

// @desc    Obtener envíos del cadete
// @route   GET /api/deliveries/cadete/deliveries
// @access  Private (Cadete)
export const getCadeteDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = supabaseAdmin
      .from('deliveries')
      .select('*, user:user_id(id, nombre, apellido, avatar)', { count: 'exact' })
      .eq('driver_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: deliveries, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: deliveries.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      deliveries: deliveries.map(formatDelivery),
    });
  } catch (error) {
    console.error("Error al obtener envíos del cadete:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener envíos del cadete",
      error: error.message,
    });
  }
};

// @desc    Cancelar envío como cadete
// @route   PUT /api/deliveries/:id/cadete-cancel
// @access  Private (Cadete)
export const cadeteCancelDelivery = async (req, res) => {
  try {
    const { reason } = req.body;

    // Verificar que el envío existe y pertenece al cadete
    const { data: existingDelivery, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', req.params.id)
      .eq('driver_id', req.user.id)
      .single();

    if (fetchError || !existingDelivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado",
      });
    }

    if (existingDelivery.status === "delivered" || existingDelivery.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un envío ${existingDelivery.status}`,
      });
    }

    // En vez de cancelar, LIBERAR y RE-OFRECER el envío a otros cadetes:
    // vuelve a 'pending' y se desasigna del cadete actual.
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .update({
        driver_id: null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Datos del usuario/comercio para la notificación a los cadetes
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average')
      .eq('id', delivery.user_id)
      .single();

    const pickupCoords = (delivery.pickup_lat && delivery.pickup_lng)
      ? { lat: delivery.pickup_lat, lng: delivery.pickup_lng }
      : null;

    // Re-ofrecer a otros cadetes (excluye al que acaba de cancelar)
    try {
      await notifyNearbyDrivers(delivery, userData, pickupCoords, req.user.id);
    } catch (notifyErr) {
      console.error('Error re-ofreciendo envío:', notifyErr);
      // El envío queda 'pending'; el fallback al ponerse online un cadete lo recupera.
    }

    // Avisar al usuario/comercio que se está REASIGNANDO (no cancelado)
    const reassignPayload = {
      deliveryId: req.params.id,
      status: 'pending',
      reason: reason || 'El cadete canceló; buscando otro cadete',
      reassigning: true,
      cancelledBy: 'driver',
      timestamp: new Date().toISOString(),
    };
    emitToUser(delivery.user_id, 'delivery:reassigning', reassignPayload);
    emitToUser(delivery.user_id, 'delivery:status_changed', reassignPayload);

    // Push al usuario/comercio
    await notificationService.sendToUser(delivery.user_id, {
      type: 'delivery_reassigning',
      title: 'Buscando otro cadete',
      body: 'El cadete canceló tu envío. Estamos buscando otro cadete.',
      data: { deliveryId: req.params.id, status: 'pending' },
    });

    console.log(`🔁 Envío ${req.params.id} liberado por cadete ${req.user.id} y re-ofrecido a otros`);

    res.json({
      success: true,
      message: "Envío liberado y re-ofrecido a otros cadetes",
      delivery: formatDelivery(delivery),
    });
  } catch (error) {
    console.error("Error al cancelar envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar envío",
      error: error.message,
    });
  }
};

// Helper para formatear respuesta de delivery
function formatDelivery(delivery, { includeCode = false } = {}) {
  // Formatear user con nombre si está disponible
  let userInfo = delivery.user_id;
  if (delivery.user && typeof delivery.user === 'object') {
    userInfo = {
      id: delivery.user.id,
      name: `${delivery.user.nombre || ''} ${delivery.user.apellido || ''}`.trim() || null,
      nombre: delivery.user.nombre,
      apellido: delivery.user.apellido,
      avatar: delivery.user.avatar,
      phone: delivery.user.telefono_numero,
    };
  }

  return {
    id: delivery.id,
    user: userInfo,
    serviceType: delivery.service_type,
    deliveryType: delivery.delivery_type,
    pickup: {
      address: delivery.pickup_address,
      coordinates: {
        lat: delivery.pickup_lat,
        lng: delivery.pickup_lng,
      },
      contactName: delivery.pickup_contact_name,
      contactPhone: delivery.pickup_contact_phone,
    },
    dropoff: {
      address: delivery.dropoff_address,
      coordinates: {
        lat: delivery.dropoff_lat,
        lng: delivery.dropoff_lng,
      },
      contactName: delivery.dropoff_contact_name,
      contactPhone: delivery.dropoff_contact_phone,
    },
    scheduledDate: delivery.scheduled_date,
    scheduledTime: {
      hour: delivery.scheduled_hour,
      minute: delivery.scheduled_minute,
    },
    packageDetails: {
      description: delivery.package_description,
      weight: delivery.package_weight,
      dimensions: {
        length: delivery.package_length,
        width: delivery.package_width,
        height: delivery.package_height,
      },
      isFragile: delivery.package_is_fragile,
      helpers: delivery.helpers_count || 0,
      vehicleType: delivery.vehicle_type,
    },
    helpers: delivery.helpers_count || 0,
    vehicleType: delivery.vehicle_type,
    status: delivery.status,
    estimatedPrice: delivery.estimated_price,
    actualPrice: delivery.actual_price,
    cashDiscountPercentage: delivery.cash_discount_percentage || 0,
    cashDiscountAmount: delivery.cash_discount_amount || 0,
    distance: delivery.distance,
    driver: delivery.driver,
    trackingNumber: delivery.tracking_number,
    notes: delivery.notes,
    // Booleano seguro para que el cadete sepa si debe pedir PIN al entregar
    // (sin exponer el código). El código en sí solo va al dueño (includeCode).
    requiresDeliveryCode: !!delivery.delivery_code,
    ...(includeCode ? { deliveryCode: delivery.delivery_code || null } : {}),
    createdAt: delivery.created_at,
    updatedAt: delivery.updated_at,
  };
}

// ==========================================
// SIMULACIÓN (solo desarrollo)
// ==========================================

// @desc    Simular ubicación del conductor (para testing)
// @route   POST /api/deliveries/simulate/location
// @access  Development only
export const simulateDriverLocation = async (req, res) => {
  try {
    const { deliveryId, latitude, longitude, heading, speed } = req.body;

    if (!deliveryId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "deliveryId, latitude y longitude son requeridos",
      });
    }

    // Obtener el delivery para saber el user_id
    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select('id, user_id, driver_id, status')
      .eq('id', deliveryId)
      .single();

    if (error || !delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery no encontrado",
      });
    }

    // Actualizar ubicación del conductor en driver_availability
    if (delivery.driver_id) {
      await supabaseAdmin
        .from('driver_availability')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('driver_id', delivery.driver_id);
    }

    // Emitir evento al usuario via WebSocket
    const eventData = {
      deliveryId,
      location: {
        lat: latitude,
        lng: longitude,
        heading: heading || 0,
        speed: speed || 0,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`📍 Simulación: Emitiendo ubicación a user:${delivery.user_id}`, eventData.location);
    emitToUser(delivery.user_id, 'delivery:driver_location', eventData);

    res.json({
      success: true,
      message: "Ubicación actualizada",
      data: {
        deliveryId,
        latitude,
        longitude,
        heading,
        emittedTo: `user:${delivery.user_id}`,
      },
    });
  } catch (error) {
    console.error("Error en simulación:", error);
    res.status(500).json({
      success: false,
      message: "Error en simulación",
      error: error.message,
    });
  }
};
