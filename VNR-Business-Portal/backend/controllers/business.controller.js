import { supabaseAdmin, supabase } from "../config/supabase.js";
import { emitToUser } from "../config/socket.js";
import notificationService from "../services/notification.service.js";
import mapsService from "../services/maps.service.js";
import { notifyNearbyDrivers } from "./delivery.controller.js";
import { estimatePrice } from "../services/pricing.service.js";
import { generateDeliveryCode } from "../utils/deliveryCode.js";

// ============================================
// Cálculo de precio para envíos de comercios
// ============================================
// Los envíos de comercio usan exactamente la misma lógica de precio que la app
// (estimatePrice → tarifas del CRM + distancia incluida + recargos como el
// nocturno). Antes había una fórmula duplicada acá que podía desincronizarse.

// Obtener porcentaje de comisión para splits
async function getCommissionSettings() {
  try {
    const { data } = await supabaseAdmin
      .from('commission_settings')
      .select('platform_percentage, driver_percentage')
      .eq('service_type', 'envio')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();
    if (data) return data;
  } catch (e) {
    // Defaults
  }
  return { platform_percentage: 20, driver_percentage: 80 };
}

// @desc    Registrar un nuevo comercio
// @route   POST /api/business/register
// @access  Public
export const registerBusiness = async (req, res) => {
  try {
    const { name, email, password, phone, address, address_lat, address_lng, cuit, domicilio_real, domicilio_real_lat, domicilio_real_lng, responsable_nombre, responsable_dni } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son requeridos",
      });
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre: name, role: 'business' },
    });

    if (authError) {
      if (authError.message?.includes('already been registered') ||
          authError.message?.includes('already exists') ||
          authError.code === 'user_already_exists') {
        return res.status(400).json({
          success: false,
          message: "Este email ya está registrado",
        });
      }
      return res.status(400).json({
        success: false,
        message: authError.message || "Error al crear usuario",
      });
    }

    // Esperar a que el trigger cree el perfil, luego asegurar role = business
    // Reintentar hasta 5 veces con espera incremental
    let profileReady = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise(r => setTimeout(r, attempt * 500));

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', authData.user.id)
        .single();

      if (!profile) continue; // trigger aún no creó el perfil

      if (profile.role === 'business') {
        profileReady = true;
        break;
      }

      // Perfil existe pero role no es business, actualizarlo
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          nombre: name,
          role: 'business',
          telefono_numero: phone || null,
          direccion: address || null,
        })
        .eq('id', authData.user.id);

      if (!updateError) {
        profileReady = true;
        break;
      }
      console.error(`Intento ${attempt} falló al actualizar role:`, updateError);
    }

    if (!profileReady) {
      // Último intento: upsert directo
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          nombre: name,
          apellido: '',
          telefono_numero: phone || '',
          direccion: address || '',
          role: 'business',
        });
    }

    // Crear registro en tabla businesses
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .insert({
        user_id: authData.user.id,
        name,
        phone: phone || null,
        address: address || null,
        address_lat: address_lat || null,
        address_lng: address_lng || null,
        cuit: cuit || null,
        domicilio_real: domicilio_real || null,
        domicilio_real_lat: domicilio_real_lat || null,
        domicilio_real_lng: domicilio_real_lng || null,
        responsable_nombre: responsable_nombre || null,
        responsable_dni: responsable_dni || null,
      })
      .select()
      .single();

    if (bizError) {
      console.error('Error creating business:', bizError);
      // Rollback: eliminar usuario auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: "Error al crear comercio",
      });
    }

    // Login para obtener token
    let token = null;
    let refreshToken = null;
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!loginError && loginData?.session) {
        token = loginData.session.access_token;
        refreshToken = loginData.session.refresh_token;
      }
    } catch (loginErr) {
      console.error('Error en auto-login post registro:', loginErr);
      // No es crítico — el comercio ya está creado, puede hacer login manual
    }

    res.status(201).json({
      success: true,
      message: "Comercio registrado exitosamente",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'business',
      },
      business,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error en registro de comercio:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Login de comercio
// @route   POST /api/business/login
// @access  Public
export const loginBusiness = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
      });
    }

    // Verificar credenciales con Supabase Auth usando admin para evitar conflictos de sesión
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const matchedUser = userList?.users?.find(u => u.email === email);

    if (listError || !matchedUser) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    // Intentar sign in para verificar contraseña y obtener token
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const userId = data.user?.id || matchedUser.id;

    // Verificar que es un comercio
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile on login:', profileError);
    }

    if (profile?.role !== 'business') {
      console.error(`Login denied: user ${email} has role '${profile?.role}' instead of 'business'`);
      return res.status(403).json({
        success: false,
        message: "Esta cuenta no es un comercio",
      });
    }

    // Obtener datos del comercio
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (bizError) {
      console.error('Error fetching business on login:', bizError);
    }

    if (!business?.is_active) {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta de comercio está desactivada",
      });
    }

    res.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: userId,
        email: data.user?.email || email,
        name: business?.name || profile?.nombre,
        role: 'business',
      },
      business,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error("Error en login de comercio:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener perfil del comercio
// @route   GET /api/business/profile
// @access  Private (business)
export const getBusinessProfile = async (req, res) => {
  try {
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !business) {
      return res.status(404).json({
        success: false,
        message: "Comercio no encontrado",
      });
    }

    res.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Actualizar perfil del comercio
// @route   PUT /api/business/profile
// @access  Private (business)
export const updateBusinessProfile = async (req, res) => {
  try {
    const { name, phone, address, address_lat, address_lng, logo_url } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (address_lat !== undefined) updates.address_lat = address_lat;
    if (address_lng !== undefined) updates.address_lng = address_lng;
    if (logo_url !== undefined) updates.logo_url = logo_url;

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Perfil actualizado",
      business,
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// Helper para generar tracking number
function generateTrackingNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'VNR-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// @desc    Estimar precio de envío
// @route   POST /api/business/estimate-price
// @access  Private (business)
export const estimateDeliveryPrice = async (req, res) => {
  try {
    const { pickup, dropoff } = req.body;

    if (!pickup || !dropoff) {
      return res.status(400).json({
        success: false,
        message: "Se requieren coordenadas de origen y destino",
      });
    }

    // Obtener distancia real via Google Maps
    let distanceKm = 0;
    let durationMin = 0;

    try {
      const origin = pickup.lat && pickup.lng
        ? { latitude: pickup.lat, longitude: pickup.lng }
        : null;
      const dest = dropoff.lat && dropoff.lng
        ? { latitude: dropoff.lat, longitude: dropoff.lng }
        : null;

      if (origin && dest) {
        const directions = await mapsService.getDirections(origin, dest);
        if (directions?.primaryRoute) {
          distanceKm = directions.primaryRoute.totalDistance.value / 1000;
          durationMin = directions.primaryRoute.totalDuration.value / 60;
        }
      }
    } catch (e) {
      console.error('Error obteniendo direcciones:', e.message);
      // Fallback: calcular distancia por Haversine
      if (pickup.lat && pickup.lng && dropoff.lat && dropoff.lng) {
        const R = 6371;
        const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
        const dLon = (dropoff.lng - pickup.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
        distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        durationMin = distanceKm * 3;
      }
    }

    if (distanceKm === 0) {
      return res.status(400).json({
        success: false,
        message: "No se pudo calcular la distancia. Verificá las direcciones.",
      });
    }

    const est = await estimatePrice({ serviceType: 'envios', distanceKm });
    console.log('Pricing (estimatePrice):', est.rate, 'Distance:', distanceKm, 'Price:', est.price);
    const estimatedPrice = est.price;
    const commission = await getCommissionSettings();

    res.json({
      success: true,
      estimate: {
        price: estimatedPrice,
        distance: Math.round(distanceKm * 10) / 10, // 1 decimal
        duration: Math.round(durationMin),
        breakdown: {
          base: est.rate.base_rate,
          perKm: est.rate.per_unit_rate,
          distanceKm: Math.round(distanceKm * 10) / 10,
          includedKm: est.includedUnits,
          billableKm: Math.round(est.billableUnits * 10) / 10,
          surchargePct: est.surchargePct,
        },
        commission: {
          platform: commission.platform_percentage,
          driver: commission.driver_percentage,
        },
      },
    });
  } catch (error) {
    console.error("Error estimando precio:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Crear solicitud de envío desde comercio (con precio calculado server-side)
// @route   POST /api/business/deliveries
// @access  Private (business)
export const createBusinessDelivery = async (req, res) => {
  try {
    const {
      pickup,
      dropoff,
      packageDescription,
      notes,
    } = req.body;

    if (!pickup?.address || !dropoff?.address) {
      return res.status(400).json({
        success: false,
        message: "Se requiere dirección de origen y destino",
      });
    }

    // Obtener business_id
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('user_id', req.user.id)
      .single();

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Comercio no encontrado",
      });
    }

    // Calcular precio server-side
    let distanceKm = 0;
    let estimatedPrice = 0;

    try {
      const origin = pickup.lat && pickup.lng
        ? { latitude: pickup.lat, longitude: pickup.lng }
        : null;
      const dest = dropoff.lat && dropoff.lng
        ? { latitude: dropoff.lat, longitude: dropoff.lng }
        : null;

      if (origin && dest) {
        const directions = await mapsService.getDirections(origin, dest);
        if (directions?.primaryRoute) {
          distanceKm = directions.primaryRoute.totalDistance.value / 1000;
        }
      }
    } catch (e) {
      console.error('Error obteniendo direcciones para delivery:', e.message);
      if (pickup.lat && pickup.lng && dropoff.lat && dropoff.lng) {
        const R = 6371;
        const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
        const dLon = (dropoff.lng - pickup.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
        distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
    }

    estimatedPrice = distanceKm > 0
      ? (await estimatePrice({ serviceType: 'envios', distanceKm })).price
      : 0;

    const trackingNumber = generateTrackingNumber();

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .insert({
        user_id: req.user.id,
        business_id: business.id,
        service_type: 'envio',
        delivery_type: 'enviar',
        status: 'pending',
        pickup_address: pickup.address,
        pickup_lat: pickup.lat || null,
        pickup_lng: pickup.lng || null,
        pickup_contact_name: pickup.contactName || business.name,
        pickup_contact_phone: pickup.contactPhone || null,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat || null,
        dropoff_lng: dropoff.lng || null,
        dropoff_contact_name: dropoff.contactName || null,
        dropoff_contact_phone: dropoff.contactPhone || null,
        package_description: packageDescription || null,
        notes: notes || null,
        estimated_price: estimatedPrice,
        distance: distanceKm > 0 ? Math.round(distanceKm * 10) / 10 : null,
        tracking_number: trackingNumber,
        delivery_code: generateDeliveryCode(),
      })
      .select()
      .single();

    if (error) throw error;

    // Obtener datos del usuario/comercio para la notificación
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average')
      .eq('id', req.user.id)
      .single();

    // Notificar a cadetes cercanos disponibles
    await notifyNearbyDrivers(delivery, userProfile, {
      lat: pickup.lat,
      lng: pickup.lng,
    });

    res.status(201).json({
      success: true,
      message: "Envío creado exitosamente",
      delivery,
    });
  } catch (error) {
    console.error("Error creando envío:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener historial de cargos/facturación del comercio
// @route   GET /api/business/charges
// @access  Private (business)
export const getBusinessCharges = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!business) {
      return res.status(404).json({ success: false, message: "Comercio no encontrado" });
    }

    let query = supabaseAdmin
      .from('business_charges')
      .select('*, delivery:deliveries(id, tracking_number, dropoff_address, created_at)', { count: 'exact' })
      .eq('business_id', business.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Calcular totales
    const { data: allCharges } = await supabaseAdmin
      .from('business_charges')
      .select('amount, status')
      .eq('business_id', business.id);

    const totals = {
      total: allCharges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0,
      pending: allCharges?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0,
      paid: allCharges?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    };

    res.json({
      success: true,
      data: data || [],
      totals,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error obteniendo cargos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Listar envíos del comercio
// @route   GET /api/business/deliveries
// @access  Private (business)
export const getBusinessDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Obtener business_id
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!business) {
      return res.status(404).json({ success: false, message: "Comercio no encontrado" });
    }

    let query = supabaseAdmin
      .from('deliveries')
      .select('*, driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido, telefono_numero, avatar)', { count: 'exact' })
      .eq('business_id', business.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error listando envíos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Detalle de envío con tracking
// @route   GET /api/business/deliveries/:id
// @access  Private (business)
export const getBusinessDeliveryById = async (req, res) => {
  try {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!business) {
      return res.status(404).json({ success: false, message: "Comercio no encontrado" });
    }

    const { data: delivery, error } = await supabaseAdmin
      .from('deliveries')
      .select('*, driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido, telefono_numero, avatar)')
      .eq('id', req.params.id)
      .eq('business_id', business.id)
      .single();

    if (error || !delivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado",
      });
    }

    // Si hay driver asignado, obtener su última ubicación
    let driverLocation = null;
    if (delivery.driver_id) {
      const { data: location } = await supabaseAdmin
        .from('driver_availability')
        .select('current_latitude, current_longitude, last_location_update')
        .eq('driver_id', delivery.driver_id)
        .single();
      driverLocation = location;
    }

    res.json({
      success: true,
      delivery,
      driverLocation,
    });
  } catch (error) {
    console.error("Error obteniendo envío:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Cancelar envío
// @route   PUT /api/business/deliveries/:id/cancel
// @access  Private (business)
export const cancelBusinessDelivery = async (req, res) => {
  try {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!business) {
      return res.status(404).json({ success: false, message: "Comercio no encontrado" });
    }

    // Verificar que el envío pertenece al comercio y está en estado cancelable
    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('id, status, driver_id')
      .eq('id', req.params.id)
      .eq('business_id', business.id)
      .single();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Envío no encontrado",
      });
    }

    if (['delivered', 'cancelled'].includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: "No se puede cancelar este envío",
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('deliveries')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Notificar al driver si hay uno asignado
    if (delivery.driver_id) {
      emitToUser(delivery.driver_id, 'delivery:status_changed', {
        deliveryId: delivery.id,
        status: 'cancelled',
        cancelledBy: 'business',
      });
    }

    res.json({
      success: true,
      message: "Envío cancelado",
      delivery: updated,
    });
  } catch (error) {
    console.error("Error cancelando envío:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Repetir un envío anterior
// @route   POST /api/business/deliveries/:id/repeat
// @access  Private (business)
export const repeatBusinessDelivery = async (req, res) => {
  try {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('user_id', req.user.id)
      .single();

    if (!business) {
      return res.status(404).json({ success: false, message: "Comercio no encontrado" });
    }

    const { data: original } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('id', req.params.id)
      .eq('business_id', business.id)
      .single();

    if (!original) {
      return res.status(404).json({ success: false, message: "Envío original no encontrado" });
    }

    let distanceKm = original.distance || 0;
    let estimatedPrice = original.estimated_price || 0;

    if (distanceKm > 0) {
      estimatedPrice = (await estimatePrice({ serviceType: 'envios', distanceKm })).price;
    }

    const trackingNumber = generateTrackingNumber();

    const { data: newDelivery, error } = await supabaseAdmin
      .from('deliveries')
      .insert({
        user_id: req.user.id,
        business_id: business.id,
        service_type: original.service_type || 'envio',
        delivery_type: original.delivery_type || 'enviar',
        status: 'pending',
        pickup_address: original.pickup_address,
        pickup_lat: original.pickup_lat,
        pickup_lng: original.pickup_lng,
        pickup_contact_name: original.pickup_contact_name || business.name,
        pickup_contact_phone: original.pickup_contact_phone,
        dropoff_address: original.dropoff_address,
        dropoff_lat: original.dropoff_lat,
        dropoff_lng: original.dropoff_lng,
        dropoff_contact_name: original.dropoff_contact_name,
        dropoff_contact_phone: original.dropoff_contact_phone,
        package_description: original.package_description,
        notes: original.notes,
        estimated_price: estimatedPrice,
        distance: distanceKm,
        tracking_number: trackingNumber,
        delivery_code: generateDeliveryCode(),
      })
      .select()
      .single();

    if (error) throw error;

    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, avatar, rating_average')
      .eq('id', req.user.id)
      .single();

    await notifyNearbyDrivers(newDelivery, userProfile, {
      lat: original.pickup_lat,
      lng: original.pickup_lng,
    });

    res.status(201).json({
      success: true,
      message: "Envío repetido exitosamente",
      delivery: newDelivery,
    });
  } catch (error) {
    console.error("Error repitiendo envío:", error);
    res.status(500).json({
      success: false,
      message: "Error al repetir envío",
      error: error.message,
    });
  }
};
