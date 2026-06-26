import { supabase } from './supabase';
import type { Ride, RideFilters, PaginatedResponse } from '../types/database';

export const ridesService = {
  // Obtener todos los viajes con paginación y filtros
  async getAll(
    page = 1,
    limit = 10,
    filters?: RideFilters
  ): Promise<PaginatedResponse<Ride>> {
    let query = supabase
      .from('rides')
      .select(`
        *,
        user:profiles!rides_user_id_fkey(id, nombre, apellido, email, telefono_numero),
        driver:profiles!rides_driver_id_fkey(id, nombre, apellido, email, telefono_numero)
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.driver_id) {
      query = query.eq('driver_id', filters.driver_id);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
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

  // Obtener viaje por ID
  async getById(id: string): Promise<Ride | null> {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        user:profiles!rides_user_id_fkey(*),
        driver:profiles!rides_driver_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar viaje
  async update(id: string, updates: Partial<Ride>): Promise<Ride> {
    const { data, error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cancelar viaje
  async cancel(id: string): Promise<Ride> {
    return this.update(id, { status: 'cancelled' });
  },

  // Asignar conductor
  async assignDriver(id: string, driverId: string): Promise<Ride> {
    return this.update(id, {
      driver_id: driverId,
      status: 'accepted'
    });
  },

  // Obtener estadísticas de viajes
  async getStats() {
    const { data, error } = await supabase
      .from('rides')
      .select('status, service_type, estimated_price, actual_price');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(r => r.status === 'pending').length || 0,
      accepted: data?.filter(r => r.status === 'accepted').length || 0,
      inProgress: data?.filter(r => r.status === 'in_progress').length || 0,
      completed: data?.filter(r => r.status === 'completed').length || 0,
      cancelled: data?.filter(r => r.status === 'cancelled').length || 0,
      vueltaSegura: data?.filter(r => r.service_type === 'vuelta_segura').length || 0,
      chofer: data?.filter(r => r.service_type === 'chofer').length || 0,
      totalRevenue: data
        ?.filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.actual_price || r.estimated_price || 0), 0) || 0,
    };

    return stats;
  },

  // Obtener viajes recientes
  async getRecent(limit = 5): Promise<Ride[]> {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        user:profiles!rides_user_id_fkey(id, nombre, apellido),
        driver:profiles!rides_driver_id_fkey(id, nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
