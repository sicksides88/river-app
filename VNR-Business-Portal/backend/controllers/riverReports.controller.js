import { supabaseAdmin } from '../config/supabase.js';
import { parseRideNotes, mapDbStatusToRiver } from '../utils/rideNotes.js';

const mapRow = (ride) => {
  const meta = parseRideNotes(ride.notes);
  const user = ride.user || ride.profiles;
  const driver = ride.driver || ride.driver_profile;
  return {
    id: ride.id,
    status: ride.status,
    riverStatus: mapDbStatusToRiver(ride.status, ride.notes),
    emergencyType: meta.emergencyType,
    navegante: user ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : '',
    naveganteEmail: user?.email || '',
    patron: driver ? `${driver.nombre || ''} ${driver.apellido || ''}`.trim() : '',
    embarcacion: meta.vesselName || meta.vessel?.name || '',
    direccion: ride.pickup_address,
    lat: ride.pickup_lat,
    lng: ride.pickup_lng,
    etaMinutes: meta.etaMinutes,
    created_at: ride.created_at,
    completed_at: ride.completed_at,
  };
};

/** GET /api/admin/reports/auxilios */
export const exportAuxiliosReport = async (req, res) => {
  try {
    const { from, to, status = 'all', format = 'json', limit = 500 } = req.query;

    let query = supabaseAdmin
      .from('rides')
      .select(`
        *,
        user:user_id (id, nombre, apellido, email, telefono_numero),
        driver:driver_id (id, nombre, apellido, telefono_numero)
      `)
      .eq('service_type', 'auxilio')
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit) || 500, 2000));

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map(mapRow);

    if (format === 'csv') {
      const headers = [
        'id', 'estado', 'estado_river', 'emergencia', 'navegante', 'email',
        'patron', 'embarcacion', 'direccion', 'lat', 'lng', 'eta_min',
        'creado', 'finalizado',
      ];
      const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [
        headers.join(';'),
        ...rows.map((r) =>
          [
            r.id, r.status, r.riverStatus, r.emergencyType, r.navegante, r.naveganteEmail,
            r.patron, r.embarcacion, r.direccion, r.lat, r.lng, r.etaMinutes,
            r.created_at, r.completed_at,
          ].map(escape).join(';')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="auxilios-river.csv"');
      return res.send('\uFEFF' + lines.join('\n'));
    }

    res.json({ success: true, count: rows.length, auxilios: rows });
  } catch (error) {
    console.error('exportAuxiliosReport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
