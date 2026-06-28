import { supabaseAdmin } from "../config/supabase.js";

/** Mismos tipos que la app móvil (VNR-Solicitante vesselForm.js) */
const VESSEL_TYPES = ['Motor', 'Vela', 'Jetsky', 'Remo'];

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

// @desc    Crear navegante o patrón desde CRM
// @route   POST /api/admin/users
// @access  Private (admin, operator)
export const createAdminUser = async (req, res) => {
  try {
    const {
      email,
      password,
      nombre,
      apellido,
      telefono_numero,
      telefono_codigo_pais,
      direccion,
      role = 'user',
      driver_status,
      insurance_company,
      policy_number,
    } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña, nombre y apellido son obligatorios',
      });
    }

    if (!['user', 'driver'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden crear navegantes (user) o patrones (driver)',
      });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido },
    });

    if (authError) {
      const msg = authError.message?.includes('already')
        ? 'Este email ya está registrado'
        : authError.message;
      return res.status(400).json({ success: false, message: msg });
    }

    const profileUpdate = {
      nombre,
      apellido,
      email,
      telefono_numero: telefono_numero || '',
      telefono_codigo_pais: telefono_codigo_pais || '+54',
      direccion: direccion || '',
      role,
      insurance_company: insurance_company || null,
      policy_number: policy_number || null,
    };

    if (role === 'driver') {
      profileUpdate.is_driver = true;
      profileUpdate.driver_status = driver_status || 'active';
      profileUpdate.driver_type = 'auxilio';
      profileUpdate.driver_services = ['auxilio'];
      profileUpdate.selected_services = ['auxilio'];
      profileUpdate.onboarding_completed = true;
    }

    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', authData.user.id)
      .select()
      .maybeSingle();

    // Si el trigger de Supabase aún no creó el perfil, hacer upsert
    if (profileError || !profile) {
      const upsertResult = await supabaseAdmin
        .from('profiles')
        .upsert({ id: authData.user.id, ...profileUpdate })
        .select()
        .single();
      profile = upsertResult.data;
      profileError = upsertResult.error;
    }

    if (profileError) throw profileError;

    res.status(201).json({
      success: true,
      message: role === 'driver' ? 'Patrón creado' : 'Navegante creado',
      profile,
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    const isConstraint =
      error.message?.includes('profiles_driver_type_check') ||
      error.message?.includes('violates check constraint');
    res.status(isConstraint ? 400 : 500).json({
      success: false,
      message: isConstraint
        ? 'Datos de patrón inválidos. Verificá el estado y tipo de conductor.'
        : error.message || 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/admin/users/:id
// @access  Private (admin, operator)
export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;
    delete updates.email; // email change via auth — omit for safety

    if (req.user?.role === 'operator') {
      delete updates.role;
    }

    if (updates.role && !['user', 'driver'].includes(updates.role)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede asignar ese rol desde el CRM River',
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (['admin', 'operator'].includes(existing.role)) {
      return res.status(403).json({
        success: false,
        message: 'No se puede modificar un usuario administrador',
      });
    }

    if (updates.role === 'driver' || existing.role === 'driver') {
      updates.is_driver = true;
      if (!updates.driver_services) updates.driver_services = ['auxilio'];
      if (!updates.driver_type) updates.driver_type = 'auxilio';
      if (!updates.selected_services) updates.selected_services = ['auxilio'];
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Usuario actualizado',
      profile,
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
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

// @desc    Búsqueda rápida de navegantes (alta telefónica CRM)
// @route   GET /api/admin/users/search?q=
// @access  Private (admin, operator)
const sanitizeSearchTerm = (term) => String(term).trim().replace(/[%_,]/g, ' ').replace(/\s+/g, ' ');

export const searchUsersForAlta = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const term = sanitizeSearchTerm(q);

    if (term.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const pattern = `%${term}%`;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, email, telefono_numero, role')
      .or(
        `nombre.ilike.${pattern},apellido.ilike.${pattern},email.ilike.${pattern},telefono_numero.ilike.${pattern}`
      )
      .not('role', 'in', '("driver","admin","operator","auditor")')
      .order('nombre', { ascending: true })
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      users: data || [],
    });
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Búsqueda de patrones activos (turnos CRM)
// @route   GET /api/admin/patrons/search?q=
// @access  Private (admin, operator)
export const searchPatronsForShift = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const term = sanitizeSearchTerm(q);

    let query = supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, email, telefono_numero, driver_status')
      .eq('role', 'driver')
      .eq('driver_status', 'active')
      .order('nombre', { ascending: true })
      .limit(30);

    if (term.length >= 1) {
      const pattern = `%${term}%`;
      query = query.or(
        `nombre.ilike.${pattern},apellido.ilike.${pattern},email.ilike.${pattern},telefono_numero.ilike.${pattern}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      patrons: data || [],
    });
  } catch (error) {
    console.error('Error buscando patrones:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Embarcaciones de un navegante (CRM alta telefónica)
// @route   GET /api/admin/users/:id/vessels
// @access  Private (admin, operator)
export const getUserVesselsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('vessels')
      .select('id, name, registration, type, length_m, user_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      vessels: data || [],
    });
  } catch (error) {
    console.error('Error listando embarcaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message,
    });
  }
};

// @desc    Crear embarcación para navegante (CRM)
// @route   POST /api/admin/users/:id/vessels
export const createAdminVessel = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { name, registration, type, length_m } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Nombre de embarcación requerido' });
    }

    if (!type || !VESSEL_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Seleccioná un tipo de embarcación: Motor, Vela, Jetsky o Remo',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('vessels')
      .insert({
        user_id: userId,
        name: name.trim(),
        registration: (registration || name).trim(),
        type,
        length_m: length_m || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, vessel: data });
  } catch (error) {
    console.error('Error creando embarcación:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Actualizar embarcación (CRM)
// @route   PUT /api/admin/vessels/:id
export const updateAdminVessel = async (req, res) => {
  try {
    const allowed = ['name', 'registration', 'type', 'length_m', 'beam_m'];
    const payload = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });

    const { data, error } = await supabaseAdmin
      .from('vessels')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, vessel: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Eliminar embarcación (CRM)
// @route   DELETE /api/admin/vessels/:id
export const deleteAdminVessel = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('vessels').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Embarcación eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Exportar tabla de usuarios a Excel/CSV
// @route   GET /api/admin/users/export
export const exportUsersReport = async (req, res) => {
  try {
    const { search, role, driver_status, format = 'csv' } = req.query;

    let query = supabaseAdmin.from('profiles').select('*');

    if (role) query = query.eq('role', role);
    if (driver_status) query = query.eq('driver_status', driver_status);
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(5000);
    if (error) throw error;

    const isDrivers = role === 'driver';
    const headers = isDrivers
      ? ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'estado_patron', 'fecha_alta']
      : ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'aseguradora', 'poliza', 'fecha_alta'];

    const rows = (data || []).map((u) => {
      if (isDrivers) {
        return [
          u.nombre,
          u.apellido,
          u.email,
          u.telefono_numero || '',
          u.direccion || '',
          u.driver_status || '',
          u.created_at || '',
        ];
      }
      return [
        u.nombre,
        u.apellido,
        u.email,
        u.telefono_numero || '',
        u.direccion || '',
        u.insurance_company || '',
        u.policy_number || '',
        u.created_at || '',
      ];
    });

    if (format === 'csv') {
      const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [
        headers.map(escape).join(';'),
        ...rows.map((r) => r.map(escape).join(';')),
      ];
      const fileName = isDrivers ? 'patrones-river.csv' : 'navegantes-river.csv';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send('\uFEFF' + lines.join('\r\n'));
    }

    res.json({ success: true, count: rows.length, users: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Importación masiva de navegantes (CSV → JSON rows)
// @route   POST /api/admin/users/import
export const importNavigatorsCSV = async (req, res) => {
  try {
    const { rows = [], defaultPassword = 'River2026!' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay filas para importar' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = String(row.email || '').trim().toLowerCase();
      const nombre = String(row.nombre || '').trim();
      const apellido = String(row.apellido || '').trim();

      if (!email || !nombre || !apellido) {
        results.errors.push({ line: i + 1, message: 'Faltan email, nombre o apellido' });
        results.skipped++;
        continue;
      }

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        results.skipped++;
        continue;
      }

      const password = row.password || defaultPassword;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre, apellido },
      });

      if (authError) {
        results.errors.push({ line: i + 1, email, message: authError.message });
        results.skipped++;
        continue;
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          nombre,
          apellido,
          email,
          role: 'user',
          telefono_numero: row.telefono || row.telefono_numero || '',
          direccion: row.direccion || '',
          insurance_company: row.insurance_company || row.aseguradora || null,
          policy_number: row.policy_number || row.poliza || null,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        results.errors.push({ line: i + 1, email, message: profileError.message });
        results.skipped++;
        continue;
      }

      results.created++;
    }

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Listar embarcaciones de auxilio (flota patrón)
// @route   GET /api/admin/patrol-vessels
export const listPatrolVessels = async (req, res) => {
  try {
    const { search, driverId } = req.query;

    let query = supabaseAdmin
      .from('driver_vehicles')
      .select(`
        *,
        driver:driver_id (id, nombre, apellido, email, driver_status)
      `)
      .eq('vehicle_type', 'boat')
      .order('created_at', { ascending: false });

    if (driverId) query = query.eq('driver_id', driverId);
    if (search) {
      const p = `%${search}%`;
      query = query.or(`brand.ilike.${p},model.ilike.${p},plate_number.ilike.${p}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, vessels: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Crear embarcación de auxilio para patrón
// @route   POST /api/admin/drivers/:id/patrol-vessels
export const createPatrolVessel = async (req, res) => {
  try {
    const { id: driverId } = req.params;
    const { name, plate_number, capacity, color, model, brand, type, hull_type } = req.body;
    const vesselType = type || hull_type;
    const vesselBrand = (brand || name || '').trim();
    const vesselPlate = (plate_number || '').trim();

    if (!vesselType || !VESSEL_TYPES.includes(vesselType)) {
      return res.status(400).json({
        success: false,
        message: 'Seleccioná un tipo de embarcación: Motor, Vela, Jetsky o Remo',
      });
    }

    if (!vesselBrand && !vesselPlate) {
      return res.status(400).json({ success: false, message: 'Nombre o matrícula requeridos' });
    }

    const { data, error } = await supabaseAdmin
      .from('driver_vehicles')
      .insert({
        driver_id: driverId,
        vehicle_type: 'boat',
        brand: vesselBrand || 'River',
        model: vesselType,
        year: new Date().getFullYear(),
        plate_number: vesselPlate || vesselBrand,
        capacity: capacity || 6,
        color: color || null,
        is_active: true,
        specs: {
          display_name: vesselBrand || name || vesselType,
          hull_type: vesselType,
        },
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, vessel: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePatrolVessel = async (req, res) => {
  try {
    const allowed = ['brand', 'model', 'plate_number', 'capacity', 'color', 'is_active', 'is_verified'];
    const payload = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });

    const { data, error } = await supabaseAdmin
      .from('driver_vehicles')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, vessel: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePatrolVessel = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('driver_vehicles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Embarcación de auxilio eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Personal CRM (roles operador / auditor)
// @route   GET /api/admin/staff
export const listCrmStaff = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nombre, apellido, email, role, created_at')
      .in('role', ['admin', 'operator', 'auditor'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, staff: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Crear operador o auditor CRM
// @route   POST /api/admin/staff
export const createCrmStaff = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Solo Super Admin puede gestionar roles' });
    }

    const { email, password, nombre, apellido, role = 'operator' } = req.body;

    if (!['operator', 'auditor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol debe ser operator o auditor' });
    }

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido },
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ nombre, apellido, email, role })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) throw profileError;

    res.status(201).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
