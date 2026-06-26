import { supabaseAdmin } from '../config/supabase.js';

/** GET /api/patrols/my-shifts — turnos del patrón (próximos y recientes) */
export const getMyShifts = async (req, res) => {
  try {
    const { from, to, limit = 20 } = req.query;
    const now = new Date();
    const defaultFrom = from || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const defaultTo = to || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('patrol_shifts')
      .select(`
        *,
        base:base_id (id, name, latitude, longitude, address)
      `)
      .eq('driver_id', req.user.id)
      .gte('starts_at', defaultFrom)
      .lte('starts_at', defaultTo)
      .order('starts_at', { ascending: true })
      .limit(Number(limit) || 20);

    if (error) throw error;

    res.json({
      success: true,
      shifts: data || [],
      count: (data || []).length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/patrols/my-shift */
export const getMyShift = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('patrol_shifts')
      .select(`
        *,
        base:base_id (id, name, latitude, longitude, address)
      `)
      .eq('driver_id', req.user.id)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .in('status', ['active', 'scheduled'])
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      hasShift: !!data,
      shift: data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/patrol-bases */
export const listPatrolBases = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('patrol_bases')
      .select('*')
      .order('name');
    if (error) throw error;
    res.json({ success: true, bases: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /api/admin/patrol-bases */
export const createPatrolBase = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'name requerido' });
    }
    const { data, error } = await supabaseAdmin
      .from('patrol_bases')
      .insert({ name, address, latitude, longitude })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, base: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/patrol-shifts */
export const listPatrolShifts = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    let query = supabaseAdmin
      .from('patrol_shifts')
      .select(`
        *,
        base:base_id (id, name),
        driver:driver_id (id, nombre, apellido, telefono_numero)
      `)
      .order('starts_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (from) query = query.gte('starts_at', from);
    if (to) query = query.lte('ends_at', to);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, shifts: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /api/admin/patrol-shifts */
export const createPatrolShift = async (req, res) => {
  try {
    const { driverId, baseId, startsAt, endsAt, status = 'scheduled' } = req.body;
    if (!driverId || !startsAt || !endsAt) {
      return res.status(400).json({
        success: false,
        message: 'driverId, startsAt y endsAt requeridos',
      });
    }
    const { data, error } = await supabaseAdmin
      .from('patrol_shifts')
      .insert({
        driver_id: driverId,
        base_id: baseId || null,
        starts_at: startsAt,
        ends_at: endsAt,
        status,
      })
      .select(`
        *,
        base:base_id (id, name),
        driver:driver_id (id, nombre, apellido)
      `)
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, shift: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /api/admin/patrol-shifts/:id */
export const updatePatrolShift = async (req, res) => {
  try {
    const { status, startsAt, endsAt, baseId } = req.body;
    const patch = {};
    if (status) patch.status = status;
    if (startsAt) patch.starts_at = startsAt;
    if (endsAt) patch.ends_at = endsAt;
    if (baseId !== undefined) patch.base_id = baseId;

    const { data, error } = await supabaseAdmin
      .from('patrol_shifts')
      .update(patch)
      .eq('id', req.params.id)
      .select(`
        *,
        base:base_id (id, name),
        driver:driver_id (id, nombre, apellido)
      `)
      .single();
    if (error) throw error;
    res.json({ success: true, shift: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
