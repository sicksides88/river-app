import api from './api';
import rideService from './ride.service';
import { buildVesselSnapshot } from '../utils/vesselForm';
import { formatDurationLabel } from '../utils/auxilioLive';

const SERVICE_TYPE = 'auxilio';

const resolveVesselFromMeta = (meta) => {
  if (meta.vessel?.name || meta.vessel?.registration) return meta.vessel;
  if (meta.vesselName || meta.vesselId) {
    return { id: meta.vesselId, name: meta.vesselName };
  }
  return null;
};

const resolveDriverFromRide = (ride, meta) => {
  const raw = meta.driver || ride?.driver || ride?.assigned_driver;
  if (!raw) return null;

  const name =
    raw.name ||
    [raw.nombre, raw.apellido].filter(Boolean).join(' ').trim() ||
    null;

  return {
    id: raw.id || raw.driverId || raw.userId,
    name,
    phone: raw.phone || raw.telefono_numero || raw.telefono,
    rating: raw.rating,
    vesselName: raw.vesselName || raw.vessel?.name || meta.driverVesselName,
    registration: raw.registration || raw.vessel?.registration || meta.driverRegistration,
    vehicle: raw.vehicle,
    avatar: raw.avatar || raw.photo,
  };
};

const buildDisplayId = (ride, meta) => {
  if (meta.displayId) return meta.displayId;
  const raw = String(ride?.id || '');
  const short = raw.replace(/-/g, '').slice(-4).toUpperCase() || '0000';
  return `#RS-${short}`;
};

const resolveDurationMinutes = (ride, meta) => {
  if (meta.durationMinutes != null) return meta.durationMinutes;
  if (ride?.duration != null) return Math.round(Number(ride.duration));
  if (meta.duration != null) return Math.round(Number(meta.duration));
  if (ride?.started_at && ride?.completed_at) {
    const diff = new Date(ride.completed_at) - new Date(ride.started_at);
    return Math.max(1, Math.round(diff / 60000));
  }
  return null;
};

const resolvePickup = (ride, meta) => {
  const nested = ride?.pickup?.coordinates;
  const lat =
    nested?.lat ??
    nested?.latitude ??
    ride?.pickup_lat ??
    meta?.location?.lat ??
    meta?.lat;
  const lng =
    nested?.lng ??
    nested?.longitude ??
    ride?.pickup_lng ??
    meta?.location?.lng ??
    meta?.lng;

  return {
    address:
      ride?.pickup?.address ||
      ride?.pickup_address ||
      meta?.location?.address ||
      meta?.pickup?.address,
    coordinates: {
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
    },
  };
};

const mapRideToAuxilio = (ride) => {
  if (!ride) return null;
  let meta = {};
  try {
    meta = ride.notes ? JSON.parse(ride.notes) : {};
  } catch {
    meta = { rawNotes: ride.notes };
  }

  meta = {
    ...meta,
    emergencyType: meta.emergencyType || ride.emergencyType,
    failureTypes: meta.failureTypes || ride.failureTypes || [],
    vessel: meta.vessel || ride.vessel,
    vesselId: meta.vesselId || ride.vesselId,
    vesselName: meta.vesselName || ride.vesselName,
    driver: meta.driver || ride.driver,
    photos: meta.photos || ride.photos || {},
    signature: meta.signature ?? ride.signature,
    pdfUrl: meta.pdfUrl || ride.pdfUrl,
    createdAt: ride.created_at || ride.createdAt || meta.createdAt,
    assignedAt: meta.assignedAt || ride.assignedAt || ride.accepted_at,
    arrivedAt: meta.arrivedAt || ride.arrivedAt || ride.arrived_at,
    startedAt: meta.startedAt || ride.startedAt || ride.started_at,
    completedAt: meta.completedAt || ride.completedAt || ride.completed_at,
  };

  const vessel = resolveVesselFromMeta(meta);
  const driver = resolveDriverFromRide(ride, meta);
  const durationMinutes = resolveDurationMinutes(ride, meta);
  const pickup = resolvePickup(ride, meta);

  const statusMap = {
    pending: 'solicitado',
    confirmed: 'buscando',
    accepted: 'asignado',
    'driver-assigned': 'asignado',
    driver_assigned: 'asignado',
    departed: 'zarpado',
    'driver-departed': 'zarpado',
    driver_departed: 'zarpado',
    zarpado: 'zarpado',
    en_route: 'zarpado',
    'en-route': 'zarpado',
    'driver-arrived': 'arribado',
    driver_arrived: 'arribado',
    arrived: 'arribado',
    'in-progress': 'en_proceso',
    in_progress: 'en_proceso',
    completed: 'finalizado',
    cancelled: 'cancelado',
    rejected: 'rechazado',
  };

  const mappedStatus = statusMap[ride.status] || ride.status || 'solicitado';

  const cancellationReason =
    meta.cancellationReason ||
    ride?.cancellation_reason ||
    ride?.cancellationReason ||
    null;
  const rejectionReason =
    meta.rejectionReason ||
    meta.rejection_reason ||
    ride?.rejection_reason ||
    ride?.rejectionReason ||
    null;

  return {
    id: ride.id,
    displayId: buildDisplayId(ride, meta),
    status: mappedStatus,
    rawStatus: ride.status,
    pickup,
    cancellationReason,
    rejectionReason,
    vesselId: vessel?.id || meta.vesselId,
    vesselName: vessel?.name || meta.vesselName,
    vessel,
    emergencyType: meta.emergencyType,
    failureTypes: meta.failureTypes || [],
    etaMinutes: meta.etaMinutes ?? driver?.eta,
    driver,
    photos: meta.photos || {},
    signature: meta.signature,
    pdfUrl: meta.pdfUrl,
    createdAt: meta.createdAt || ride.created_at || ride.createdAt,
    updatedAt: ride.updated_at || ride.updatedAt,
    assignedAt: meta.assignedAt || ride.accepted_at || ride.assigned_at,
    arrivedAt: meta.arrivedAt || ride.arrived_at,
    startedAt: meta.startedAt || ride.started_at,
    completedAt: meta.completedAt || ride.completed_at,
    durationMinutes,
    durationLabel: meta.durationLabel || formatDurationLabel(durationMinutes),
    ride,
  };
};

export const auxilioService = {
  async createAuxilio(payload) {
    const {
      vessel,
      vesselId,
      vesselName,
      emergencyType,
      failureTypes,
      location,
      linkType,
    } = payload;

    const vesselSnapshot = buildVesselSnapshot(vessel) || (
      vesselId || vesselName
        ? { id: vesselId, name: vesselName }
        : null
    );

    const notes = JSON.stringify({
      vesselId: vesselSnapshot?.id || vesselId,
      vesselName: vesselSnapshot?.name || vesselName,
      vessel: vesselSnapshot,
      emergencyType,
      failureTypes: failureTypes || [],
      linkType,
      location: location
        ? {
            lat: location.lat,
            lng: location.lng,
            address: location.address,
            reference: location.reference,
          }
        : undefined,
      photos: {},
    });

    const body = {
      serviceType: SERVICE_TYPE,
      pickup: {
        address: location?.address || `Lat ${location?.lat?.toFixed(5)}, Lng ${location?.lng?.toFixed(5)}`,
        coordinates: { lat: location?.lat, lng: location?.lng },
      },
      dropoff: {
        address: location?.address || 'Ubicación de auxilio',
        coordinates: { lat: location?.lat, lng: location?.lng },
      },
      estimatedPrice: 0,
      distance: 0,
      duration: 0,
      notes,
    };

    const response = await api.post('/auxilio', body);
    if (response.data?.auxilio) {
      const auxilio = mapRideToAuxilio(response.data.ride || response.data.auxilio);
      return { success: true, auxilio };
    }
    if (response.data?.ride) {
      return { success: true, auxilio: mapRideToAuxilio(response.data.ride) };
    }
    return response.data;
  },

  async getUserAuxilios(params = {}) {
    const response = await api.get('/auxilio', { params });
    const list = response.data?.auxilios || response.data?.rides || [];
    return {
      success: true,
      auxilios: list.map(mapRideToAuxilio),
    };
  },

  async getAuxilioById(id) {
    const response = await api.get(`/auxilio/${id}`);
    const raw = response.data?.ride || response.data?.auxilio;
    return { success: true, auxilio: mapRideToAuxilio(raw) };
  },

  async cancelAuxilio(id) {
    if (!id) {
      throw new Error('ID de auxilio requerido');
    }

    const payload = { reason: 'user_cancelled' };

    try {
      const response = await api.put(`/auxilio/${id}/cancel`, payload);
      return response.data;
    } catch (auxilioError) {
      const status = auxilioError.response?.status;
      const message = auxilioError.response?.data?.message || '';

      if (status === 400 && /cancel/i.test(message)) {
        return { success: true, alreadyCancelled: true, message };
      }

      try {
        const response = await api.put(`/rides/${id}/cancel`, payload);
        return response.data;
      } catch (rideError) {
        const rideMessage = rideError.response?.data?.message || '';
        if (rideError.response?.status === 400 && /cancel/i.test(rideMessage)) {
          return { success: true, alreadyCancelled: true, message: rideMessage };
        }
        throw rideError;
      }
    }
  },

  async reportProblem(id, reason) {
    const response = await api.post(`/auxilio/${id}/report`, { reason });
    return response.data;
  },

  // Patrón
  async acceptAuxilio(id, { vehicleId, etaMinutes } = {}) {
    const response = await api.put(`/auxilio/${id}/accept`, { vehicleId, etaMinutes });
    return response.data;
  },

  async rejectAuxilio(id, reason) {
    const response = await api.put(`/auxilio/${id}/reject`, { reason });
    return response.data;
  },

  async updateAuxilioStatus(id, status, extra = {}) {
    const response = await api.put(`/auxilio/${id}/status`, { status, ...extra });
    return response.data;
  },

  async uploadAuxilioPhoto(id, phase, photoUri) {
    const response = await api.post(`/auxilio/${id}/photos`, { phase, photoUri });
    return response.data;
  },

  async saveSignature(id, signatureData) {
    const response = await api.post(`/auxilio/${id}/signature`, { signatureData });
    return response.data;
  },

  mapRideToAuxilio,

  // Fallback directo al ride service si el endpoint auxilio no existe aún
  ...rideService,
};

export default auxilioService;
