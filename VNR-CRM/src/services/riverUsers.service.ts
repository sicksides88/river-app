import api from './api';
import { supabase } from './supabase';
import type { NavigatorVessel } from './auxilioAdmin.service';

export interface RiverUserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono_numero?: string;
  telefono_codigo_pais?: string;
  direccion?: string;
  role: string;
  driver_status?: string | null;
  is_driver?: boolean;
  insurance_company?: string | null;
  policy_number?: string | null;
  created_at?: string;
}

export interface PatrolVessel {
  id: string;
  driver_id: string;
  brand?: string;
  model?: string;
  plate_number?: string;
  capacity?: number;
  color?: string;
  is_active?: boolean;
  specs?: { hull_type?: string; display_name?: string };
  driver?: { id: string; nombre: string; apellido: string; email?: string; driver_status?: string };
}

export interface CrmStaffProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: 'admin' | 'operator' | 'auditor';
  created_at?: string;
}

export interface PaginatedUsers {
  success: boolean;
  data: RiverUserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const riverUsersService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    role: 'user' | 'driver';
    driver_status?: string;
  }) {
    const { data } = await api.get('/admin/users', { params });
    return data as PaginatedUsers;
  },

  async getById(id: string) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data as { success: boolean; profile: RiverUserProfile };
  },

  async create(payload: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono_numero?: string;
    telefono_codigo_pais?: string;
    direccion?: string;
    role: 'user' | 'driver';
    driver_status?: string;
    insurance_company?: string;
    policy_number?: string;
  }) {
    const { data } = await api.post('/admin/users', payload);
    return data;
  },

  async update(id: string, payload: Partial<RiverUserProfile>) {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  async listVessels(userId: string) {
    const { data } = await api.get(`/admin/users/${userId}/vessels`);
    return data as { success: boolean; vessels: NavigatorVessel[] };
  },

  async createVessel(
    userId: string,
    payload: { name: string; registration?: string; type?: string; length_m?: number }
  ) {
    const { data } = await api.post(`/admin/users/${userId}/vessels`, payload);
    return data;
  },

  async updateVessel(
    vesselId: string,
    payload: { name?: string; registration?: string; type?: string; length_m?: number }
  ) {
    const { data } = await api.put(`/admin/vessels/${vesselId}`, payload);
    return data;
  },

  async deleteVessel(vesselId: string) {
    const { data } = await api.delete(`/admin/vessels/${vesselId}`);
    return data;
  },

  async downloadUsersExcel(params: { role: 'user' | 'driver'; search?: string }) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const base = import.meta.env.VITE_API_URL || 'https://river-backend-idio.onrender.com/api';
    const qs = new URLSearchParams({ role: params.role, format: 'csv' });
    if (params.search) qs.set('search', params.search);
    const res = await fetch(`${base}/admin/users/export?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al exportar');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = params.role === 'user' ? 'navegantes-river.csv' : 'patrones-river.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  async listPatrolVessels(params?: { search?: string; driverId?: string }) {
    const { data } = await api.get('/admin/patrol-vessels', { params });
    return data as { success: boolean; vessels: PatrolVessel[] };
  },

  async createPatrolVessel(
    driverId: string,
    payload: {
      name?: string;
      brand?: string;
      plate_number?: string;
      capacity?: number;
      color?: string;
      model?: string;
      type?: string;
    }
  ) {
    const { data } = await api.post(`/admin/drivers/${driverId}/patrol-vessels`, payload);
    return data;
  },

  async updatePatrolVessel(
    vesselId: string,
    payload: Partial<{
      driver_id: string;
      brand: string;
      name: string;
      type: string;
      plate_number: string;
      capacity: number;
      color: string;
      is_active: boolean;
    }>
  ) {
    const { data } = await api.put(`/admin/patrol-vessels/${vesselId}`, payload);
    return data;
  },

  async deletePatrolVessel(vesselId: string) {
    const { data } = await api.delete(`/admin/patrol-vessels/${vesselId}`);
    return data;
  },

  async listStaff() {
    const { data } = await api.get('/admin/staff');
    return data as { success: boolean; staff: CrmStaffProfile[] };
  },

  async createStaff(payload: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    role: 'operator' | 'auditor';
  }) {
    const { data } = await api.post('/admin/staff', payload);
    return data;
  },
};

export default riverUsersService;
