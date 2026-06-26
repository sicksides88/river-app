import api from './api';

export interface AdminAuxilioUser {
  id: string;
  nombre?: string;
  apellido?: string;
  telefono_numero?: string;
  email?: string;
}

export interface AdminAuxilio {
  id: string;
  status: string;
  riverStatus?: string;
  emergencyType?: string;
  etaMinutes?: number;
  priority?: number;
  priorityOverride?: number | null;
  timeline?: Array<{ event: string; at: string }>;
  photos?: Record<string, string>;
  signature?: string;
  vessel?: { name?: string; registration?: string };
  vesselName?: string;
  pickup?: {
    address?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  user?: AdminAuxilioUser | null;
  driver?: AdminAuxilioUser | null;
  created_at?: string;
  accepted_at?: string;
  completed_at?: string;
}

export interface PatrolOnDuty {
  id: string;
  nombre?: string;
  apellido?: string;
  telefono_numero?: string;
  location?: { lat?: number; lng?: number; updatedAt?: string };
}

export const auxilioAdminService = {
  async listAuxilios(status = 'active') {
    const { data } = await api.get('/admin/auxilios', { params: { status } });
    return data as {
      success: boolean;
      auxilios: AdminAuxilio[];
      stats: {
        active: number;
        pending: number;
        inProgress: number;
        completedToday: number;
      };
    };
  },

  async getAuxilio(id: string) {
    const { data } = await api.get(`/admin/auxilios/${id}`);
    return data as { success: boolean; auxilio: AdminAuxilio };
  },

  async createAuxilio(payload: {
    userId: string;
    pickup: { address?: string; coordinates: { lat: number; lng: number } };
    emergencyType?: string;
    failureTypes?: string[];
    vessel?: Record<string, unknown>;
  }) {
    const { data } = await api.post('/admin/auxilios', payload);
    return data;
  },

  async assignAuxilio(
    id: string,
    payload: { driverId: string; etaMinutes?: number; vehicleId?: string }
  ) {
    const { data } = await api.put(`/admin/auxilios/${id}/assign`, payload);
    return data;
  },

  async setPriority(id: string, priority: number) {
    const { data } = await api.put(`/admin/auxilios/${id}/priority`, { priority });
    return data;
  },

  async listPatrolsOnDuty() {
    const { data } = await api.get('/admin/patrols/on-duty');
    return data as { success: boolean; patrols: PatrolOnDuty[]; count: number };
  },

  async listShifts(params?: { status?: string }) {
    const { data } = await api.get('/admin/patrol-shifts', { params });
    return data as { success: boolean; shifts: Record<string, unknown>[] };
  },

  async createShift(payload: {
    driverId: string;
    baseId?: string;
    startsAt: string;
    endsAt: string;
    status?: string;
  }) {
    const { data } = await api.post('/admin/patrol-shifts', payload);
    return data;
  },

  async listBases() {
    const { data } = await api.get('/admin/patrol-bases');
    return data as { success: boolean; bases: Record<string, unknown>[] };
  },

  async createBase(payload: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { data } = await api.post('/admin/patrol-bases', payload);
    return data;
  },
};

export default auxilioAdminService;
