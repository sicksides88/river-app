import { supabaseAdmin } from '../config/supabase.js';
import rideQueueService from '../services/rideQueue.service.js';
import { emitToUser } from '../config/socket.js';
import {
  parseRideNotes,
  mergeRideNotes,
  setEtaMinutes,
  appendTimelineEvent,
  mapDbStatusToRiver,
  getAcceptedAtFromRide,
} from '../utils/rideNotes.js';
import { getEmergencyPriority } from '../services/geo.service.js';

const parseCoord = (value) => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const mapRideToAdminAuxilio = (ride) => {
  if (!ride) return null;
  const meta = parseRideNotes(ride.notes);
  const user = ride.user || ride.profiles;
  const driver = ride.driver || ride.driver_profile;
  const pickupLat = parseCoord(ride.pickup_lat);
  const pickupLng = parseCoord(ride.pickup_lng);

  return {
    id: ride.id,
    status: ride.status,
    riverStatus: mapDbStatusToRiver(ride.status, ride.notes),
    serviceType: ride.service_type,
    pickup: {
      address: ride.pickup_address,
      coordinates:
        pickupLat != null && pickupLng != null
          ? { lat: pickupLat, lng: pickupLng }
          : { lat: null, lng: null },
    },
    emergencyType: meta.emergencyType,
    failureTypes: meta.failureTypes || [],
    etaMinutes: meta.etaMinutes,
    priority: getEmergencyPriority(ride.notes),
    priorityOverride: meta.priorityOverride ?? null,
    timeline: meta.timeline || [],
    photos: meta.photos || {},
    signature: meta.signature,
    vessel: meta.vessel,
    vesselId: meta.vesselId,
    vesselName: meta.vesselName,
    patrolVehicleId: meta.patrolVehicleId ?? null,
    user: user
      ? {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          telefono_numero: user.telefono_numero,
          email: user.email,
        }
      : null,
    driver: driver
      ? {
          id: driver.id,
          nombre: driver.nombre,
          apellido: driver.apellido,
          telefono_numero: driver.telefono_numero,
        }
      : ride.driver_id
        ? { id: ride.driver_id }
        : null,
    created_at: ride.created_at,
    accepted_at: getAcceptedAtFromRide(ride),
    arrived_at: ride.arrived_at,
    started_at: ride.started_at,
    completed_at: ride.completed_at,
  };
};

/** Ubicación GPS actual de patrones asignados (embarcación de auxilio) */
const attachDriverLocations = async (auxilios) => {
  const driverIds = [...new Set(auxilios.map((a) => a.driver?.id).filter(Boolean))];
  if (!driverIds.length) return auxilios;

  const { data, error } = await supabaseAdmin
    .from('driver_availability')
    .select('driver_id, current_latitude, current_longitude, last_location_update')
    .in('driver_id', driverIds);

  if (error || !data?.length) return auxilios;

  const locByDriver = Object.fromEntries(
    data.map((row) => [
      row.driver_id,
      {
        lat: parseCoord(row.current_latitude),
        lng: parseCoord(row.current_longitude),
        updatedAt: row.last_location_update,
      },
    ])
  );

  return auxilios.map((auxilio) => {
    const driverId = auxilio.driver?.id;
    if (!driverId) return auxilio;
    const loc = locByDriver[driverId];
    if (!loc || loc.lat == null || loc.lng == null) return auxilio;
    return { ...auxilio, driverLocation: loc };
  });
};

/** GET /api/admin/auxilios */
export const listAdminAuxilios = async (req, res) => {
  try {
    const { status = 'all', limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('rides')
      .select(`
        *,
        user:user_id (id, nombre, apellido, telefono_numero, email),
        driver:driver_id (id, nombre, apellido, telefono_numero)
      `)
      .eq('service_type', 'auxilio')
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 50);

    if (status === 'active') {
      query = query.in('status', ['pending', 'accepted', 'arrived', 'in_progress']);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const auxilios = await attachDriverLocations(
      (data || [])
        .map(mapRideToAdminAuxilio)
        .sort((a, b) => {
          const pa = a.priorityOverride ?? a.priority;
          const pb = b.priorityOverride ?? b.priority;
          if (pa !== pb) return pa - pb;
          return new Date(b.created_at) - new Date(a.created_at);
        })
    );

    const active = auxilios.filter((a) =>
      ['pending', 'accepted', 'arrived', 'in_progress'].includes(a.status)
    );

    res.json({
      success: true,
      auxilios,
      stats: {
        active: active.length,
        pending: auxilios.filter((a) => a.status === 'pending').length,
        inProgress: auxilios.filter((a) =>
          ['accepted', 'arrived', 'in_progress'].includes(a.status)
        ).length,
        completedToday: auxilios.filter((a) => {
          if (a.status !== 'completed') return false;
          const today = new Date().toDateString();
          return new Date(a.completed_at).toDateString() === today;
        }).length,
      },
    });
  } catch (error) {
    console.error('listAdminAuxilios:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/auxilios/:id */
export const getAdminAuxilio = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rides')
      .select(`
        *,
        user:user_id (id, nombre, apellido, telefono_numero, email),
        driver:driver_id (id, nombre, apellido, telefono_numero)
      `)
      .eq('id', req.params.id)
      .eq('service_type', 'auxilio')
      .single();

    if (error) throw error;
    const [auxilio] = await attachDriverLocations([mapRideToAdminAuxilio(data)]);
    res.json({ success: true, auxilio });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Auxilio no encontrado' });
  }
};

/** POST /api/admin/auxilios — alta telefónica */
export const createAdminAuxilio = async (req, res) => {
  try {
    const { userId, pickup, emergencyType, failureTypes, vessel, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId requerido' });
    }
    if (!pickup?.coordinates?.lat || !pickup?.coordinates?.lng) {
      return res.status(400).json({ success: false, message: 'Ubicación requerida' });
    }

    const meta = {
      emergencyType: emergencyType || 'mecanica',
      failureTypes: failureTypes || [],
      vessel,
      createdBy: 'operator',
      operatorId: req.user.id,
      source: 'phone',
    };

    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        user_id: userId,
        service_type: 'auxilio',
        pickup_address: pickup.address || `Lat ${pickup.coordinates.lat}, Lng ${pickup.coordinates.lng}`,
        pickup_lat: pickup.coordinates.lat,
        pickup_lng: pickup.coordinates.lng,
        dropoff_address: pickup.address || pickup.address,
        dropoff_lat: pickup.coordinates.lat,
        dropoff_lng: pickup.coordinates.lng,
        status: 'pending',
        notes: JSON.stringify(meta),
      })
      .select()
      .single();

    if (error) throw error;

    await rideQueueService.startSearch(ride);

    res.status(201).json({
      success: true,
      auxilio: mapRideToAdminAuxilio(ride),
    });
  } catch (error) {
    console.error('createAdminAuxilio:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /api/admin/auxilios/:id/assign */
export const assignAdminAuxilio = async (req, res) => {
  try {
    const { driverId, etaMinutes = 30, vehicleId } = req.body;
    const rideId = req.params.id;

    if (!driverId) {
      return res.status(400).json({ success: false, message: 'driverId requerido' });
    }

    await rideQueueService.cancelSearch(rideId, 'manual_assign');

    const { data: existingRide, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('service_type', 'auxilio')
      .single();

    if (fetchError || !existingRide) {
      return res.status(404).json({ success: false, message: 'Auxilio no encontrado' });
    }

    const parsedEta = Number(etaMinutes);
    const resolvedEta =
      Number.isFinite(parsedEta) && parsedEta >= 1 ? Math.round(parsedEta) : 30;

    let notes = setEtaMinutes(existingRide.notes, resolvedEta);
    notes = appendTimelineEvent(notes, 'assigned', {
      driverId,
      operatorId: req.user.id,
      etaMinutes: resolvedEta,
    });

    if (vehicleId) {
      notes = mergeRideNotes(notes, { patrolVehicleId: vehicleId });
    }
    notes = mergeRideNotes(notes, { assignedAt: new Date().toISOString() });

    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .update({
        driver_id: driverId,
        status: 'accepted',
        notes,
      })
      .eq('id', rideId)
      .select(`
        *,
        user:user_id (id, nombre, apellido, telefono_numero, email),
        driver:driver_id (id, nombre, apellido, telefono_numero)
      `)
      .single();

    if (error) {
      console.error('assignAdminAuxilio update error:', error);
      throw error;
    }

    const meta = parseRideNotes(ride.notes);
    emitToUser(ride.user_id, 'auxilio:status_changed', {
      rideId: ride.id,
      auxilioId: ride.id,
      status: 'asignado',
      etaMinutes: meta.etaMinutes,
    });
    emitToUser(driverId, 'ride:new_request', {
      rideId: ride.id,
      serviceType: 'auxilio',
      manualAssign: true,
    });

    res.json({ success: true, auxilio: mapRideToAdminAuxilio(ride) });
  } catch (error) {
    console.error('assignAdminAuxilio:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /api/admin/auxilios/:id/priority */
export const setAdminAuxilioPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const parsed = Number(priority);
    if (!Number.isFinite(parsed)) {
      return res.status(400).json({ success: false, message: 'priority numérico requerido' });
    }

    const { data: ride } = await supabaseAdmin
      .from('rides')
      .select('notes')
      .eq('id', req.params.id)
      .single();

    const notes = mergeRideNotes(ride?.notes, {
      priorityOverride: Math.round(parsed),
      priorityUpdatedAt: new Date().toISOString(),
      priorityUpdatedBy: req.user.id,
    });

    const { data, error } = await supabaseAdmin
      .from('rides')
      .update({ notes })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, auxilio: mapRideToAdminAuxilio(data) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/admin/patrols/on-duty */
export const listPatrolsOnDuty = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('driver_availability')
      .select(`
        driver_id,
        is_available,
        current_latitude,
        current_longitude,
        last_location_update,
        active_service_type,
        profiles:driver_id (
          id, nombre, apellido, avatar, telefono_numero, rating_average, driver_status
        )
      `)
      .eq('is_available', true)
      .eq('active_service_type', 'auxilio');

    if (error) throw error;

    const patrols = (data || [])
      .filter((d) => d.profiles?.driver_status === 'active')
      .map((d) => ({
        id: d.driver_id,
        nombre: d.profiles?.nombre,
        apellido: d.profiles?.apellido,
        telefono_numero: d.profiles?.telefono_numero,
        avatar: d.profiles?.avatar,
        rating: d.profiles?.rating_average,
        location: {
          lat: d.current_latitude,
          lng: d.current_longitude,
          updatedAt: d.last_location_update,
        },
        activeServiceType: d.active_service_type,
      }));

    res.json({ success: true, patrols, count: patrols.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
