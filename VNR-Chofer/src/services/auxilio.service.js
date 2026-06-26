import api from './api';
import rideService from './ride.service';

const SERVICE_TYPE = 'auxilio';

const resolveVesselFromMeta = (meta) => {
  if (meta.vessel?.name || meta.vessel?.registration) return meta.vessel;
  if (meta.vesselName || meta.vesselId) {
    return { id: meta.vesselId, name: meta.vesselName };
  }
  return null;
};

const mapRideToAuxilio = (ride) => {
  if (!ride) return null;
  let meta = {};
  try {
    meta = ride.notes ? JSON.parse(ride.notes) : {};
  } catch {
    meta = { rawNotes: ride.notes };
  }

  const vessel = resolveVesselFromMeta(meta);
  const statusMap = {
    pending: 'solicitado',
    confirmed: 'buscando',
    accepted: 'asignado',
    'driver-assigned': 'asignado',
    driver_assigned: 'asignado',
    'driver-arrived': 'arribado',
    driver_arrived: 'arribado',
    arrived: 'arribado',
    zarpado: 'zarpado',
    en_proceso: 'en_proceso',
    'in-progress': 'en_proceso',
    in_progress: 'en_proceso',
    completed: 'finalizado',
    cancelled: 'cancelado',
    rejected: 'rechazado',
  };

  const user = ride.user || meta.user || meta.solicitante;
  const solicitante = user
    ? {
        id: user.id,
        name: user.name || [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || null,
        phone: user.phone || user.telefono_numero || user.telefono,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        telefono_numero: user.telefono_numero,
      }
    : null;

  return {
    id: ride.id,
    status: statusMap[ride.status] || ride.status || 'solicitado',
    rawStatus: ride.status,
    driverId: ride.driver_id || ride.driverId,
    pickup: {
      address: ride.pickup_address,
      coordinates: {
        lat: ride.pickup_lat,
        lng: ride.pickup_lng,
      },
    },
    vesselId: vessel?.id || meta.vesselId,
    vesselName: vessel?.name || meta.vesselName,
    vessel,
    emergencyType: meta.emergencyType,
    failureTypes: meta.failureTypes || [],
    etaMinutes: meta.etaMinutes,
    solicitante,
    user: solicitante,
    driver: meta.driver,
    photos: meta.photos || {},
    signature: meta.signature,
    departureBase: meta.departureBase,
    serviceReason: meta.serviceReason,
    returnCompleted: meta.returnCompleted,
    reference: meta.reference,
    createdAt: ride.created_at,
    updatedAt: ride.updated_at,
    ride,
  };
};

export const auxilioService = {
  async createAuxilio(payload) {
    const {
      vesselId,
      vesselName,
      emergencyType,
      failureTypes,
      location,
      linkType,
    } = payload;

    const notes = JSON.stringify({
      vesselId,
      vesselName,
      emergencyType,
      failureTypes: failureTypes || [],
      linkType,
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
      return { success: true, auxilio: response.data.auxilio };
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
    const ride = response.data?.auxilio || response.data?.ride;
    return { success: true, auxilio: mapRideToAuxilio(ride) };
  },

  async cancelAuxilio(id) {
    const response = await api.put(`/auxilio/${id}/cancel`);
    return response.data;
  },

  /** Patrón abandona un auxilio aceptado (libera el viaje). */
  async abandonAuxilio(id, reason = 'driver_abandon') {
    const response = await api.put(`/rides/${id}/driver-cancel`, { reason });
    return response.data;
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
