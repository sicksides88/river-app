import { supabaseAdmin } from "../config/supabase.js";

// @desc    Listar usuarios (paginado)
// @route   GET /api/admin/users
// @access  Private (admin)
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, driver_status, is_verified } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }
    if (driver_status) {
      query = query.eq('driver_status', driver_status);
    }
    if (is_verified !== undefined) {
      query = query.eq('is_verified', is_verified === 'true');
    }
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%`);
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
    console.error("Error listando usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/admin/users/:id
// @access  Private (admin)
export const getUserById = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/admin/users/:id
// @access  Private (admin)
export const updateUser = async (req, res) => {
  try {
    const updates = req.body;

    // No permitir cambios peligrosos sin validar
    delete updates.id;
    delete updates.created_at;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Usuario actualizado",
      profile,
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Eliminar usuario completo (perfil + auth + datos relacionados)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Obtener perfil
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, role')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Proteger admins
    if (profile.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar un administrador",
      });
    }

    // Si es business, limpiar datos de comercio
    if (profile.role === 'business') {
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (business) {
        await supabaseAdmin.from('business_charges').delete().eq('business_id', business.id);
        await supabaseAdmin.from('deliveries').delete().eq('business_id', business.id);
        await supabaseAdmin.from('businesses').delete().eq('id', business.id);
      }
    }

    // Si es driver, limpiar datos de conductor
    if (profile.role === 'driver') {
      await supabaseAdmin.from('driver_documents').delete().eq('driver_id', userId);
      await supabaseAdmin.from('driver_vehicles').delete().eq('driver_id', userId);
      await supabaseAdmin.from('driver_availability').delete().eq('driver_id', userId);
    }

    // Limpiar deliveries/rides como usuario
    await supabaseAdmin.from('deliveries').update({ user_id: null }).eq('user_id', userId);
    await supabaseAdmin.from('rides').update({ user_id: null }).eq('user_id', userId);

    // Eliminar perfil
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) throw deleteError;

    // Eliminar usuario de auth
    await supabaseAdmin.auth.admin.deleteUser(userId);

    res.json({
      success: true,
      message: `Usuario "${profile.nombre} ${profile.apellido}" eliminado`,
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

// @desc    Estadísticas de usuarios
// @route   GET /api/admin/users/stats
// @access  Private (admin)
export const getUserStats = async (req, res) => {
  try {
    const { data: allProfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('role, driver_status, is_verified');

    if (error) throw error;

    const stats = {
      totalUsers: allProfiles?.length || 0,
      verifiedUsers: allProfiles?.filter(p => p.is_verified).length || 0,
      totalDrivers: allProfiles?.filter(p => p.role === 'driver').length || 0,
      pendingDrivers: allProfiles?.filter(p => p.driver_status === 'pending_review' || p.driver_status === 'pending_documents').length || 0,
      approvedDrivers: allProfiles?.filter(p => p.driver_status === 'active').length || 0,
      suspendedDrivers: allProfiles?.filter(p => p.driver_status === 'suspended').length || 0,
      admins: allProfiles?.filter(p => p.role === 'admin').length || 0,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error obteniendo stats:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
};
