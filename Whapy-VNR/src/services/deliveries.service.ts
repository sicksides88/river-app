import { supabase } from './supabase';
import type { Delivery, DeliveryFilters, PaginatedResponse } from '../types/database';

export const deliveriesService = {
  // Obtener todos los envíos con paginación y filtros
  async getAll(
    page = 1,
    limit = 10,
    filters?: DeliveryFilters
  ): Promise<PaginatedResponse<Delivery>> {
    let query = supabase
      .from('deliveries')
      .select(`
        *,
        user:profiles!deliveries_user_id_fkey(id, nombre, apellido, email, telefono_numero),
        driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido, email, telefono_numero)
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type);
    }
    if (filters?.delivery_type) {
      query = query.eq('delivery_type', filters.delivery_type);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.driver_id) {
      query = query.eq('driver_id', filters.driver_id);
    }
    if (filters?.tracking_number) {
      query = query.ilike('tracking_number', `%${filters.tracking_number}%`);
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

  // Obtener envío por ID
  async getById(id: string): Promise<Delivery | null> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        user:profiles!deliveries_user_id_fkey(*),
        driver:profiles!deliveries_driver_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar por tracking number
  async getByTrackingNumber(trackingNumber: string): Promise<Delivery | null> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        user:profiles!deliveries_user_id_fkey(*),
        driver:profiles!deliveries_driver_id_fkey(*)
      `)
      .eq('tracking_number', trackingNumber)
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar envío
  async update(id: string, updates: Partial<Delivery>): Promise<Delivery> {
    const { data, error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cancelar envío
  async cancel(id: string): Promise<Delivery> {
    return this.update(id, { status: 'cancelled' });
  },

  // Asignar conductor
  async assignDriver(id: string, driverId: string): Promise<Delivery> {
    return this.update(id, {
      driver_id: driverId,
      status: 'accepted'
    });
  },

  // Actualizar estado
  async updateStatus(id: string, status: Delivery['status']): Promise<Delivery> {
    return this.update(id, { status });
  },

  // Obtener estadísticas de envíos
  async getStats() {
    const { data, error } = await supabase
      .from('deliveries')
      .select('status, service_type, delivery_type, estimated_price, actual_price');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(d => d.status === 'pending').length || 0,
      accepted: data?.filter(d => d.status === 'accepted').length || 0,
      pickedUp: data?.filter(d => d.status === 'picked_up').length || 0,
      inTransit: data?.filter(d => d.status === 'in_transit').length || 0,
      delivered: data?.filter(d => d.status === 'delivered').length || 0,
      cancelled: data?.filter(d => d.status === 'cancelled').length || 0,
      envios: data?.filter(d => d.service_type === 'envios').length || 0,
      fletes: data?.filter(d => d.service_type === 'fletes').length || 0,
      totalRevenue: data
        ?.filter(d => d.status === 'delivered')
        .reduce((sum, d) => sum + (d.actual_price || d.estimated_price || 0), 0) || 0,
    };

    return stats;
  },

  // Obtener envíos recientes
  async getRecent(limit = 5): Promise<Delivery[]> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        user:profiles!deliveries_user_id_fkey(id, nombre, apellido),
        driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
