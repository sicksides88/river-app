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
  failureTypes?: string[];
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
  driverLocation?: { lat: number; lng: number; updatedAt?: string };
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

export interface NavigatorSearchResult {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono_numero?: string;
}

export interface NavigatorVessel {
  id: string;
  name?: string;
  registration?: string;
  type?: string;
  length_m?: number;
}

export interface PatronSearchResult {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono_numero?: string;
}

export interface PatrolBase {
  id: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatrolShift {
  id: string;
  driver_id: string;
  base_id?: string | null;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  driver?: { id: string; nombre?: string; apellido?: string; telefono_numero?: string };
  base?: { id: string; name?: string } | null;
}

const formatPersonLabel = (person: { nombre?: string; apellido?: string; email?: string }) =>
  `${person.nombre || ''} ${person.apellido || ''}`.trim() || person.email || 'Sin nombre';

const formatPersonSublabel = (person: { email?: string; telefono_numero?: string }) =>
  [person.email, person.telefono_numero].filter(Boolean).join(' · ');

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
    return data as { success: boolean; shifts: PatrolShift[] };
  },

  async createShift(payload: {
    driverId: string;
    baseId?: string;
    startsAt: string;
    endsAt: string;
    status?: string;
  }) {
    const { data } = await api.post('/admin/patrol-shifts', payload);
    return data as { success: boolean; shift: PatrolShift };
  },

  async updateShift(
    id: string,
    payload: {
      driverId?: string;
      baseId?: string | null;
      startsAt?: string;
      endsAt?: string;
      status?: string;
    }
  ) {
    const { data } = await api.put(`/admin/patrol-shifts/${id}`, payload);
    return data as { success: boolean; shift: PatrolShift };
  },

  async deleteShift(id: string) {
    const { data } = await api.delete(`/admin/patrol-shifts/${id}`);
    return data as { success: boolean; shift?: { id: string } };
  },

  async listBases() {
    const { data } = await api.get('/admin/patrol-bases');
    return data as { success: boolean; bases: PatrolBase[] };
  },

  async createBase(payload: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { data } = await api.post('/admin/patrol-bases', payload);
    return data as { success: boolean; base: PatrolBase };
  },

  async updateBase(
    id: string,
    payload: {
      name?: string;
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
    }
  ) {
    const { data } = await api.put(`/admin/patrol-bases/${id}`, payload);
    return data as { success: boolean; base: PatrolBase };
  },

  async deleteBase(id: string) {
    const { data } = await api.delete(`/admin/patrol-bases/${id}`);
    return data as { success: boolean; base?: { id: string; name?: string } };
  },

  async searchUsers(q: string) {
    const { data } = await api.get('/admin/users/search', { params: { q } });
    return data as { success: boolean; users: NavigatorSearchResult[] };
  },

  async searchPatrons(q: string) {
    const { data } = await api.get('/admin/patrons/search', { params: { q } });
    return data as { success: boolean; patrons: PatronSearchResult[] };
  },

  async searchUsersAsOptions(q: string) {
    const res = await this.searchUsers(q);
    return (res.users || []).map((user) => ({
      id: user.id,
      label: formatPersonLabel(user),
      sublabel: formatPersonSublabel(user),
    }));
  },

  async searchPatronsAsOptions(q: string) {
    const res = await this.searchPatrons(q);
    return (res.patrons || []).map((patron) => ({
      id: patron.id,
      label: formatPersonLabel(patron),
      sublabel: formatPersonSublabel(patron),
    }));
  },

  async getUserVessels(userId: string) {
    const { data } = await api.get(`/admin/users/${userId}/vessels`);
    return data as { success: boolean; vessels: NavigatorVessel[] };
  },
};

export default auxilioAdminService;
