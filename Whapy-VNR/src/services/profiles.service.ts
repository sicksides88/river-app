import { supabase } from './supabase';
import type { Profile, ProfileFilters, PaginatedResponse } from '../types/database';

export const profilesService = {
  // Obtener todos los perfiles con paginación y filtros
  async getAll(
    page = 1,
    limit = 10,
    filters?: ProfileFilters
  ): Promise<PaginatedResponse<Profile>> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.driver_status) {
      query = query.eq('driver_status', filters.driver_status);
    }
    if (filters?.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }
    if (filters?.search) {
      query = query.or(
        `nombre.ilike.%${filters.search}%,apellido.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  // Obtener perfil por ID
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar perfil
  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .in('driver_status', ['pending_documents', 'pending_review'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Aprobar conductor
  async approveDriver(id: string): Promise<Profile> {
    return this.update(id, {
      driver_status: 'active',
      driver_approved_at: new Date().toISOString(),
      is_verified: true,
    });
  },

  // Rechazar conductor (vuelve a pending_documents para que suba docs de nuevo)
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

  // Obtener estadísticas de usuarios
  async getStats() {
    const { data: allProfiles, error } = await supabase
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

    return stats;
  },
};
