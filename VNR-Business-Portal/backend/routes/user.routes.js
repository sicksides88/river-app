import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = express.Router();

const isMissingTableError = (error) =>
  error?.code === "PGRST205" || /could not find the table/i.test(error?.message || "");

// @desc    Obtener historial de viajes y envíos del usuario
// @route   GET /api/users/history
// @access  Private
router.get("/history", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const serviceType = req.query.serviceType; // 'vuelta_segura', 'envio', 'flete', 'chofer', o null para todos

    // Obtener viajes (vuelta_segura y chofer) - solo los que avanzaron más allá de búsqueda
    let ridesQuery = supabaseAdmin
      .from('rides')
      .select('id, created_at, status, estimated_price, pickup_address, dropoff_address, service_type, driver:driver_id(id, nombre, apellido, avatar)')
      .eq('user_id', req.user.id)
      .in('status', ['accepted', 'arriving', 'arrived', 'in_progress', 'completed', 'cancelled']);

    if (serviceType === 'vuelta_segura' || serviceType === 'chofer') {
      ridesQuery = ridesQuery.eq('service_type', serviceType);
    }

    const { data: rides, error: ridesError } = await ridesQuery;
    if (ridesError) throw ridesError;

    // Obtener envíos y fletes - solo los que fueron confirmados por un conductor
    let deliveriesQuery = supabaseAdmin
      .from('deliveries')
      .select('id, created_at, status, estimated_price, pickup_address, dropoff_address, service_type, driver:driver_id(id, nombre, apellido, avatar)')
      .eq('user_id', req.user.id)
      .in('status', ['confirmed', 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff', 'delivered', 'cancelled']);

    if (serviceType === 'envio' || serviceType === 'flete') {
      deliveriesQuery = deliveriesQuery.eq('service_type', serviceType);
    }

    const { data: deliveries, error: deliveriesError } = await deliveriesQuery;
    if (deliveriesError && !isMissingTableError(deliveriesError)) {
      throw deliveriesError;
    }
    const deliveryRows = deliveriesError ? [] : deliveries || [];

    // Combinar y formatear resultados
    const history = [];

    // Agregar viajes al historial (solo si no se filtró por envio/flete)
    // Excluir cancelados sin conductor (cancelados durante búsqueda)
    if (!serviceType || serviceType === 'vuelta_segura' || serviceType === 'chofer') {
      rides
        .filter(ride => !(ride.status === 'cancelled' && !ride.driver))
        .forEach(ride => {
          history.push({
            id: ride.id,
            type: 'ride',
            serviceType: ride.service_type || 'vuelta_segura',
            serviceName: ride.service_type === 'chofer' ? 'Chofer' : 'Vuelta Segura',
            destination: ride.dropoff_address,
            origin: ride.pickup_address,
            price: ride.estimated_price,
            status: ride.status,
            date: ride.created_at,
            driver: ride.driver ? {
              id: ride.driver.id,
              name: `${ride.driver.nombre || ''} ${ride.driver.apellido || ''}`.trim() || 'Conductor',
              avatar: ride.driver.avatar,
            } : null,
          });
        });
    }

    // Agregar envíos/fletes al historial (solo si no se filtró por viajes)
    // Excluir cancelados sin conductor (cancelados durante búsqueda)
    if (!serviceType || serviceType === 'envio' || serviceType === 'flete') {
      deliveryRows
        .filter(delivery => !(delivery.status === 'cancelled' && !delivery.driver))
        .forEach(delivery => {
          history.push({
            id: delivery.id,
            type: 'delivery',
            serviceType: delivery.service_type || 'envio',
            serviceName: delivery.service_type === 'flete' ? 'Flete' : 'Envío',
            destination: delivery.dropoff_address,
            origin: delivery.pickup_address,
            price: delivery.estimated_price,
            status: delivery.status,
            date: delivery.created_at,
            driver: delivery.driver ? {
              id: delivery.driver.id,
              name: `${delivery.driver.nombre || ''} ${delivery.driver.apellido || ''}`.trim() || 'Cadete',
              avatar: delivery.driver.avatar,
            } : null,
          });
        });
    }

    // Ordenar por fecha descendente
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Aplicar paginación
    const total = history.length;
    const paginatedHistory = history.slice(offset, offset + limit);

    res.json({
      success: true,
      count: paginatedHistory.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      history: paginatedHistory,
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial",
      error: error.message,
    });
  }
});

// @desc    Obtener viaje o envío activo del usuario
// @route   GET /api/users/active-trip
// @access  Private
router.get("/active-trip", protect, async (req, res) => {
  try {
    // Estados que indican un viaje/envío en curso
    const activeStatuses = ['pending', 'confirmed', 'accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit', 'arrived_pickup', 'arrived_dropoff'];

    // Buscar viaje activo (incluyendo coordenadas)
    const { data: activeRide, error: activeRideError } = await supabaseAdmin
      .from('rides')
      .select('id, created_at, status, estimated_price, pickup_address, dropoff_address, service_type, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, driver:driver_id(id, nombre, apellido, avatar, telefono_numero, rating_average)')
      .eq('user_id', req.user.id)
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeRideError) throw activeRideError;

    // Buscar envío activo - SOLO con conductor asignado (no pending)
    // El estado 'pending' significa que está buscando conductor, no es un viaje "en curso"
    const deliveryActiveStatuses = ['confirmed', 'accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit', 'arrived_pickup', 'arrived_dropoff'];

    const { data: activeDelivery, error: activeDeliveryError } = await supabaseAdmin
      .from('deliveries')
      .select('id, created_at, status, estimated_price, pickup_address, dropoff_address, service_type, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, driver:driver_id(id, nombre, apellido, avatar, telefono_numero, rating_average)')
      .eq('user_id', req.user.id)
      .in('status', deliveryActiveStatuses)
      .not('driver_id', 'is', null) // Solo con conductor asignado
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeDeliveryError && !isMissingTableError(activeDeliveryError)) {
      throw activeDeliveryError;
    }

    const activeDeliveryRow = activeDeliveryError ? null : activeDelivery;

    // Determinar cuál es más reciente
    let activeTrip = null;

    if (activeRide && activeDeliveryRow) {
      // Si hay ambos, devolver el más reciente
      activeTrip = new Date(activeRide.created_at) > new Date(activeDeliveryRow.created_at)
        ? { ...activeRide, type: 'ride' }
        : { ...activeDeliveryRow, type: 'delivery' };
    } else if (activeRide) {
      activeTrip = { ...activeRide, type: 'ride' };
    } else if (activeDeliveryRow) {
      activeTrip = { ...activeDeliveryRow, type: 'delivery' };
    }

    if (!activeTrip) {
      return res.json({
        success: true,
        hasActiveTrip: false,
        activeTrip: null,
      });
    }

    // Obtener información del vehículo si hay conductor asignado
    let vehicleInfo = null;
    if (activeTrip.driver?.id) {
      const { data: vehicle } = await supabaseAdmin
        .from('driver_vehicles')
        .select('id, brand, model, color, plate_number, vehicle_type')
        .eq('driver_id', activeTrip.driver.id)
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

    // Formatear respuesta con pickup y dropoff siempre incluidos
    const formattedTrip = {
      id: activeTrip.id,
      type: activeTrip.type,
      serviceType: activeTrip.service_type || (activeTrip.type === 'ride' ? 'vuelta_segura' : 'envio'),
      status: activeTrip.status,
      origin: activeTrip.pickup_address,
      destination: activeTrip.dropoff_address,
      price: activeTrip.estimated_price,
      date: activeTrip.created_at,
      pickup: {
        lat: activeTrip.pickup_lat,
        lng: activeTrip.pickup_lng,
        address: activeTrip.pickup_address,
      },
      dropoff: {
        lat: activeTrip.dropoff_lat,
        lng: activeTrip.dropoff_lng,
        address: activeTrip.dropoff_address,
      },
      driver: activeTrip.driver ? {
        id: activeTrip.driver.id,
        name: `${activeTrip.driver.nombre || ''} ${activeTrip.driver.apellido || ''}`.trim() || 'Conductor',
        avatar: activeTrip.driver.avatar,
        phone: activeTrip.driver.telefono_numero,
        rating: activeTrip.driver.rating_average || 5.0,
        vehicle: vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : null,
        vehicleColor: vehicleInfo?.color,
        plate: vehicleInfo?.plate,
      } : null,
    };

    res.json({
      success: true,
      hasActiveTrip: true,
      activeTrip: formattedTrip,
    });
  } catch (error) {
    console.error("Error fetching active trip:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener viaje activo",
      error: error.message,
    });
  }
});

// @desc    Actualizar perfil de usuario
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      telefono,
      direccion,
      password,
      onboarding_completed,
      selected_services,
      terms_accepted,
    } = req.body;

    // Preparar datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;
    if (direccion) updateData.direccion = direccion;
    if (telefono) {
      if (telefono.codigoPais) updateData.telefono_codigo_pais = telefono.codigoPais;
      if (telefono.numero) updateData.telefono_numero = telefono.numero;
    }
    // Campos de onboarding
    if (typeof onboarding_completed === 'boolean') {
      updateData.onboarding_completed = onboarding_completed;
    }
    if (selected_services) {
      updateData.selected_services = selected_services;
    }
    if (typeof terms_accepted === 'boolean') {
      updateData.terms_accepted = terms_accepted;
    }

    // Actualizar perfil en Supabase
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Si hay cambio de contraseña, actualizarla en Auth
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        req.user.id,
        { password }
      );
      if (authError) throw authError;
    }

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: {
        id: profile.id,
        nombre: profile.nombre,
        apellido: profile.apellido,
        email: profile.email,
        avatar: profile.avatar,
        telefono: {
          codigoPais: profile.telefono_codigo_pais,
          numero: profile.telefono_numero,
        },
        direccion: profile.direccion,
        role: profile.role,
        onboarding_completed: profile.onboarding_completed,
        selected_services: profile.selected_services,
        terms_accepted: profile.terms_accepted,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
});

// @desc    Subir/actualizar avatar del usuario
// @route   PUT /api/users/avatar
// @access  Private
router.put("/avatar", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileData } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, message: "No se envió imagen" });
    }

    // Decode base64
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `avatars/${userId}/avatar_${Date.now()}.jpg`;

    // Inicializar bucket si no existe
    const BUCKET = 'user-avatars';
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.some(b => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
      });
    }

    // Eliminar avatar anterior si existe
    const { data: oldFiles } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(`avatars/${userId}`);
    if (oldFiles?.length > 0) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove(oldFiles.map(f => `avatars/${userId}/${f.name}`));
    }

    // Subir nueva imagen
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Actualizar perfil
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ avatar: avatarUrl })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Avatar actualizado",
      avatar: avatarUrl,
      user: {
        id: profile.id,
        nombre: profile.nombre,
        apellido: profile.apellido,
        email: profile.email,
        avatar: profile.avatar,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir avatar",
      error: error.message,
    });
  }
});

export default router;
