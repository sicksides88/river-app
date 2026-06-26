import { supabaseAdmin } from "../config/supabase.js";
import { emitToDriver, emitToUser } from "../config/socket.js";
import notificationService from "../services/notification.service.js";

// @desc    Listar comercios (paginado)
// @route   GET /api/admin/businesses
// @access  Private (admin)
export const getBusinesses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, is_active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('businesses')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
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
    console.error("Error listando comercios:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Detalle de comercio
// @route   GET /api/admin/businesses/:id
// @access  Private (admin)
export const getBusinessById = async (req, res) => {
  try {
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !business) {
      return res.status(404).json({
        success: false,
        message: "Comercio no encontrado",
      });
    }

    // Obtener stats de deliveries
    const { data: deliveries } = await supabaseAdmin
      .from('deliveries')
      .select('status')
      .eq('business_id', business.id);

    const stats = {
      total: deliveries?.length || 0,
      pending: deliveries?.filter(d => d.status === 'pending').length || 0,
      active: deliveries?.filter(d => !['pending', 'delivered', 'cancelled'].includes(d.status)).length || 0,
      delivered: deliveries?.filter(d => d.status === 'delivered').length || 0,
      cancelled: deliveries?.filter(d => d.status === 'cancelled').length || 0,
    };

    res.json({
      success: true,
      business,
      stats,
    });
  } catch (error) {
    console.error("Error obteniendo comercio:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Activar/desactivar comercio
// @route   PUT /api/admin/businesses/:id
// @access  Private (admin)
export const updateBusiness = async (req, res) => {
  try {
    const { is_active, name, phone, address } = req.body;

    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Comercio actualizado",
      business,
    });
  } catch (error) {
    console.error("Error actualizando comercio:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Listar pedidos de comercios
// @route   GET /api/admin/business-deliveries
// @access  Private (admin)
export const getBusinessDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, business_id, date_from, date_to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        business:businesses!deliveries_business_id_fkey(id, name, phone),
        driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido, telefono_numero, avatar)
      `, { count: 'exact' })
      .not('business_id', 'is', null);

    if (status) {
      query = query.eq('status', status);
    }
    if (business_id) {
      query = query.eq('business_id', business_id);
    }
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
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
    console.error("Error listando pedidos de comercios:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Asignar cadete a pedido de comercio
// @route   PUT /api/admin/business-deliveries/:id/assign
// @access  Private (admin)
export const assignDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: "Se requiere driver_id",
      });
    }

    // Verificar que la delivery existe y tiene business_id
    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('*, business:businesses!deliveries_business_id_fkey(id, name, user_id)')
      .eq('id', req.params.id)
      .single();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Solo se puede asignar cadete a pedidos pendientes",
      });
    }

    // Verificar que el driver existe y es cadete
    const { data: driver } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, role, driver_status')
      .eq('id', driver_id)
      .single();

    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: "Cadete no encontrado",
      });
    }

    // Asignar driver y cambiar status a confirmed
    const { data: updated, error } = await supabaseAdmin
      .from('deliveries')
      .update({
        driver_id,
        status: 'confirmed',
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Notificar al driver via socket
    emitToDriver(driver_id, 'delivery:assigned', {
      deliveryId: delivery.id,
      pickup_address: delivery.pickup_address,
      dropoff_address: delivery.dropoff_address,
      businessName: delivery.business?.name,
    });

    // Notificar al driver via push
    try {
      await notificationService.sendToUser(driver_id, {
        title: 'Nuevo envío asignado',
        body: `Tenés un envío de ${delivery.business?.name || 'un comercio'}`,
        data: {
          type: 'delivery_assigned',
          deliveryId: delivery.id,
        },
      });
    } catch (e) {
      console.error('Error enviando push al driver:', e);
    }

    // Notificar al comercio via socket
    if (delivery.business?.user_id) {
      emitToUser(delivery.business.user_id, 'delivery:status_changed', {
        deliveryId: delivery.id,
        status: 'confirmed',
        driver: {
          id: driver.id,
          nombre: driver.nombre,
          apellido: driver.apellido,
        },
      });
    }

    res.json({
      success: true,
      message: `Cadete ${driver.nombre} ${driver.apellido} asignado`,
      delivery: updated,
    });
  } catch (error) {
    console.error("Error asignando cadete:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Listar cargos de comercios (facturación)
// @route   GET /api/admin/business-charges
// @access  Private (admin)
export const getBusinessCharges = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, business_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('business_charges')
      .select(`
        *,
        business:businesses!business_charges_business_id_fkey(id, name, phone),
        delivery:deliveries!business_charges_delivery_id_fkey(id, tracking_number, dropoff_address, created_at)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Calcular totales
    let totalsQuery = supabaseAdmin
      .from('business_charges')
      .select('amount, status');

    if (business_id) {
      totalsQuery = totalsQuery.eq('business_id', business_id);
    }

    const { data: allCharges } = await totalsQuery;

    const totals = {
      total: (allCharges || []).reduce((sum, c) => sum + Number(c.amount), 0),
      pending: (allCharges || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0),
      invoiced: (allCharges || []).filter(c => c.status === 'invoiced').reduce((sum, c) => sum + Number(c.amount), 0),
      paid: (allCharges || []).filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0),
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
    console.error("Error listando cargos:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Marcar cargo como facturado
// @route   PUT /api/admin/business-charges/:id/invoice
// @access  Private (admin)
export const invoiceCharge = async (req, res) => {
  try {
    const { invoice_number } = req.body;

    const { data: charge, error } = await supabaseAdmin
      .from('business_charges')
      .update({
        status: 'invoiced',
        invoiced_at: new Date().toISOString(),
        invoice_number: invoice_number || null,
      })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !charge) {
      return res.status(400).json({
        success: false,
        message: "No se pudo facturar el cargo (quizás ya fue facturado)",
      });
    }

    res.json({
      success: true,
      message: "Cargo marcado como facturado",
      charge,
    });
  } catch (error) {
    console.error("Error facturando cargo:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Marcar cargo como pagado
// @route   PUT /api/admin/business-charges/:id/pay
// @access  Private (admin)
export const payCharge = async (req, res) => {
  try {
    const { data: charge, error } = await supabaseAdmin
      .from('business_charges')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .in('status', ['pending', 'invoiced'])
      .select()
      .single();

    if (error || !charge) {
      return res.status(400).json({
        success: false,
        message: "No se pudo marcar como pagado",
      });
    }

    res.json({
      success: true,
      message: "Cargo marcado como pagado",
      charge,
    });
  } catch (error) {
    console.error("Error marcando pago:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Eliminar comercio (y su usuario auth)
// @route   DELETE /api/admin/businesses/:id
// @access  Private (admin)
export const deleteBusiness = async (req, res) => {
  try {
    // Obtener el comercio para saber el user_id
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id, name')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !business) {
      return res.status(404).json({
        success: false,
        message: "Comercio no encontrado",
      });
    }

    // Verificar que no tenga envíos activos
    const { data: activeDeliveries } = await supabaseAdmin
      .from('deliveries')
      .select('id')
      .eq('business_id', business.id)
      .in('status', ['pending', 'confirmed', 'picked_up', 'in_transit'])
      .limit(1);

    if (activeDeliveries && activeDeliveries.length > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar: tiene envíos activos",
      });
    }

    // Eliminar cargos asociados
    await supabaseAdmin
      .from('business_charges')
      .delete()
      .eq('business_id', business.id);

    // Eliminar envíos históricos
    await supabaseAdmin
      .from('deliveries')
      .delete()
      .eq('business_id', business.id);

    // Eliminar el registro de business
    const { error: deleteError } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', business.id);

    if (deleteError) throw deleteError;

    // Eliminar el perfil
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', business.user_id);

    // Eliminar usuario de auth
    await supabaseAdmin.auth.admin.deleteUser(business.user_id);

    res.json({
      success: true,
      message: `Comercio "${business.name}" eliminado`,
    });
  } catch (error) {
    console.error("Error eliminando comercio:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Listar cadetes disponibles
// @route   GET /api/admin/available-drivers
// @access  Private (admin)
export const getAvailableDrivers = async (req, res) => {
  try {
    // Obtener drivers disponibles con info de perfil
    const { data: available, error } = await supabaseAdmin
      .from('driver_availability')
      .select(`
        driver_id,
        is_available,
        current_latitude,
        current_longitude,
        last_location_update,
        driver:profiles!driver_availability_driver_id_fkey(id, nombre, apellido, telefono_numero, avatar, driver_status, selected_services)
      `)
      .eq('is_available', true);

    if (error) throw error;

    // Filtrar solo cadetes activos
    const drivers = (available || []).filter(d =>
      d.driver?.driver_status === 'active' &&
      d.driver?.selected_services?.includes('cadete')
    ).map(d => ({
      id: d.driver_id,
      nombre: d.driver?.nombre,
      apellido: d.driver?.apellido,
      telefono: d.driver?.telefono_numero,
      avatar: d.driver?.avatar,
      lat: d.current_latitude,
      lng: d.current_longitude,
      last_update: d.last_location_update,
    }));

    res.json({
      success: true,
      drivers,
    });
  } catch (error) {
    console.error("Error listando cadetes:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};
