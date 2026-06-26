import express from "express";
import {
  registerAsDriver,
  getDriverStatus,
  uploadDocumentFile,
  uploadDocument,
  getDocuments,
  addVehicle,
  getVehicles,
  updateVehicle,
  updateAvailability,
  getTrustPoints,
  reviewDocument,
  getPendingDrivers,
  updateDriverStatus,
} from "../controllers/driver.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// ============ RUTAS DE CONDUCTOR ============

// Registro como conductor
router.post("/register", protect, registerAsDriver);

// Estado del conductor
router.get("/status", protect, getDriverStatus);

// Documentos
router.post("/documents/upload", protect, uploadDocumentFile);
router.post("/documents", protect, uploadDocument);
router.get("/documents", protect, getDocuments);

// Vehículos
router.post("/vehicles", protect, addVehicle);
router.get("/vehicles", protect, getVehicles);
router.put("/vehicles/:id", protect, updateVehicle);

// Disponibilidad (para conductores activos)
router.post("/availability", protect, updateAvailability);

// Puntos de confianza
router.get("/trust-points", protect, getTrustPoints);

// Obtener viaje/envío activo del conductor
router.get("/active-trip", protect, async (req, res) => {
  console.log('📍 getActiveTrip called for driver:', req.user.id);
  try {
    const { supabaseAdmin } = await import('../config/supabase.js');

    // Estados que indican un viaje/envío activo para el conductor
    // Agregamos 'confirmed' que es el estado cuando el conductor acepta
    const activeStatuses = ['confirmed', 'accepted', 'arrived', 'in_progress', 'picked_up', 'in_transit', 'arrived_pickup', 'arrived_dropoff', 'driver-assigned', 'driver-arrived', 'in-progress'];

    // Debug: Ver todos los envíos del conductor
    const { data: allDeliveries } = await supabaseAdmin
      .from('deliveries')
      .select('id, status, driver_id')
      .eq('driver_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('📍 Recent deliveries for driver:', allDeliveries);

    // Buscar viaje activo donde el conductor es el asignado (incluyendo coordenadas)
    const { data: activeRide } = await supabaseAdmin
      .from('rides')
      .select('id, created_at, status, estimated_price, pickup_address, dropoff_address, service_type, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, user:user_id(id, nombre, apellido, avatar, telefono_numero)')
      .eq('driver_id', req.user.id)
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Buscar envío activo donde el conductor es el asignado
    const { data: activeDelivery } = await supabaseAdmin
      .from('deliveries')
      .select('id, created_at, status, estimated_price, pickup_address, dropoff_address, service_type, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, package_description, package_weight, package_length, package_width, package_height, package_is_fragile, user:user_id(id, nombre, apellido, avatar, telefono_numero)')
      .eq('driver_id', req.user.id)
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determinar cuál es más reciente
    let activeTrip = null;

    if (activeRide && activeDelivery) {
      activeTrip = new Date(activeRide.created_at) > new Date(activeDelivery.created_at)
        ? { ...activeRide, type: 'ride' }
        : { ...activeDelivery, type: 'delivery' };
    } else if (activeRide) {
      activeTrip = { ...activeRide, type: 'ride' };
    } else if (activeDelivery) {
      activeTrip = { ...activeDelivery, type: 'delivery' };
    }

    if (!activeTrip) {
      console.log('📍 No active trip found for driver:', req.user.id);
      return res.json({
        success: true,
        hasActiveTrip: false,
        activeTrip: null,
      });
    }

    console.log('📍 Active trip found:', activeTrip.id, 'type:', activeTrip.type, 'status:', activeTrip.status);

    // Consultar el método de pago del servicio
    let paymentMethod = 'cash';
    try {
      const paymentQuery = activeTrip.type === 'ride'
        ? supabaseAdmin.from('payments').select('payment_method').eq('ride_id', activeTrip.id).single()
        : supabaseAdmin.from('payments').select('payment_method').eq('delivery_id', activeTrip.id).single();
      const { data: paymentInfo } = await paymentQuery;
      if (paymentInfo?.payment_method) {
        paymentMethod = paymentInfo.payment_method;
      }
    } catch (e) {
      // No payment found, default to cash
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
      paymentMethod,
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
      user: activeTrip.user ? {
        id: activeTrip.user.id,
        name: `${activeTrip.user.nombre || ''} ${activeTrip.user.apellido || ''}`.trim() || null,
        nombre: activeTrip.user.nombre,
        apellido: activeTrip.user.apellido,
        avatar: activeTrip.user.avatar,
        phone: activeTrip.user.telefono_numero,
      } : null,
      // Detalles del paquete para envíos
      ...(activeTrip.type === 'delivery' && {
        packageDescription: activeTrip.package_description,
        packageWeight: activeTrip.package_weight,
        packageDimensions: {
          height: activeTrip.package_height,
          width: activeTrip.package_width,
          depth: activeTrip.package_length,
        },
        packageIsFragile: activeTrip.package_is_fragile,
      }),
    };

    res.json({
      success: true,
      hasActiveTrip: true,
      activeTrip: formattedTrip,
    });
  } catch (error) {
    console.error("Error fetching driver active trip:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener viaje activo",
      error: error.message,
    });
  }
});

// Auto-activar conductor (SOLO DESARROLLO - quitar en producción real)
router.post("/dev/activate", protect, async (req, res) => {
  try {
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_driver: true,
        driver_status: 'active',
        driver_verified_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conductor activado',
      is_driver: data.is_driver,
      driver_status: data.driver_status,
    });
  } catch (error) {
    console.error('Error activando conductor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ RUTAS DE ADMIN ============

// Revisar documento
router.put("/admin/documents/:documentId", protect, authorize("admin"), reviewDocument);

// Obtener conductores pendientes
router.get("/admin/pending", protect, authorize("admin"), getPendingDrivers);

// Actualizar estado del conductor
router.put("/admin/:driverId/status", protect, authorize("admin"), updateDriverStatus);

export default router;
