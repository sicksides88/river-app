import { api } from './api';
import type { Profile, ProfileFilters, PaginatedResponse } from '../types/database';

export const profilesService = {
  // Obtener todos los perfiles con paginación y filtros (via API backend)
  async getAll(
    page = 1,
    limit = 10,
    filters?: ProfileFilters
  ): Promise<PaginatedResponse<Profile>> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (filters?.role) params.role = filters.role;
    if (filters?.driver_status) params.driver_status = filters.driver_status;
    if (filters?.is_verified !== undefined) params.is_verified = String(filters.is_verified);
    if (filters?.search) params.search = filters.search;

    const { data: result } = await api.get('/admin/users', { params });

    return {
      data: result.data || [],
      total: result.total || 0,
      page: result.page || page,
      limit: result.limit || limit,
      totalPages: result.totalPages || 0,
    };
  },

  // Obtener perfil por ID (via API backend)
  async getById(id: string): Promise<Profile | null> {
    const { data: result } = await api.get(`/admin/users/${id}`);
    return result.profile || null;
  },

  // Actualizar perfil (via API backend)
  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data: result } = await api.put(`/admin/users/${id}`, updates);
    return result.profile;
  },

  // Cambiar rol de usuario
  async updateRole(id: string, role: Profile['role']): Promise<Profile> {
    return this.update(id, { role });
  },

  // Verificar usuario
  async verify(id: string): Promise<Profile> {
    return this.update(id, { is_verified: true });
  },

  // Obtener conductores pendientes de aprobación
  async getPendingDrivers(): Promise<Profile[]> {
    const result = await this.getAll(1, 100, {
      role: 'driver',
      driver_status: 'pending_review',
    });
    return result.data;
  },

  // Aprobar conductor
  async approveDriver(id: string): Promise<Profile> {
    return this.update(id, {
      driver_status: 'active',
      driver_approved_at: new Date().toISOString(),
      is_verified: true,
    });
  },

  // Rechazar conductor
  async rejectDriver(id: string, reason?: string): Promise<Profile> {
    return this.update(id, {
      driver_status: 'pending_documents',
      suspension_reason: reason || null,
    });
  },

  // Suspender conductor
  async suspendDriver(id: string, reason: string): Promise<Profile> {
    return this.update(id, {
      driver_status: 'suspended',
      driver_suspended_at: new Date().toISOString(),
      suspension_reason: reason,
    });
  },

  // Reactivar conductor
  async reactivateDriver(id: string): Promise<Profile> {
    return this.update(id, {
      driver_status: 'active',
      driver_suspended_at: null,
      suspension_reason: null,
    });
  },

  // Eliminar usuario (via API backend - borra perfil + auth + datos relacionados)
  async delete(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  // Obtener estadísticas de usuarios (via API backend)
  async getStats() {
    const { data: result } = await api.get('/admin/users/stats');
    return result.stats;
  },
};
