import { supabase } from './supabase';
import type {
  DriverDocument,
  DriverVehicle,
  DriverAvailability,
  TrustPointsLog,
  DocumentFilters,
  PaginatedResponse
} from '../types/database';

export const driversService = {
  // ============================================
  // DRIVER DOCUMENTS
  // ============================================

  // Obtener todos los documentos con filtros
  async getDocuments(
    page = 1,
    limit = 10,
    filters?: DocumentFilters
  ): Promise<PaginatedResponse<DriverDocument>> {
    let query = supabase
      .from('driver_documents')
      .select(`
        *,
        driver:profiles!driver_documents_driver_id_fkey(id, nombre, apellido, email)
      `, { count: 'exact' });

    if (filters?.driver_id) {
      query = query.eq('driver_id', filters.driver_id);
    }
    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

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

  // Obtener documentos pendientes
  async getPendingDocuments(): Promise<DriverDocument[]> {
    const { data, error } = await supabase
      .from('driver_documents')
      .select(`
        *,
        driver:profiles!driver_documents_driver_id_fkey(id, nombre, apellido, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener documentos de un conductor
  async getDriverDocuments(driverId: string): Promise<DriverDocument[]> {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Aprobar documento
  async approveDocument(id: string, reviewerId: string): Promise<DriverDocument> {
    const { data, error } = await supabase
      .from('driver_documents')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Rechazar documento
  async rejectDocument(
    id: string,
    reviewerId: string,
    reason: string
  ): Promise<DriverDocument> {
    const { data, error } = await supabase
      .from('driver_documents')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================
  // DRIVER VEHICLES
  // ============================================

  // Obtener vehículos de un conductor
  async getDriverVehicles(driverId: string): Promise<DriverVehicle[]> {
    const { data, error } = await supabase
      .from('driver_vehicles')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener todos los vehículos
  async getAllVehicles(page = 1, limit = 10): Promise<PaginatedResponse<DriverVehicle>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('driver_vehicles')
      .select(`
        *,
        driver:profiles!driver_vehicles_driver_id_fkey(id, nombre, apellido, email)
      `, { count: 'exact' })
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

  // Verificar vehículo
  async verifyVehicle(id: string): Promise<DriverVehicle> {
    const { data, error } = await supabase
      .from('driver_vehicles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================
  // DRIVER AVAILABILITY
  // ============================================

  // Obtener disponibilidad de conductores online
  async getOnlineDrivers(): Promise<DriverAvailability[]> {
    const { data, error } = await supabase
      .from('driver_availability')
      .select(`
        *,
        driver:profiles!driver_availability_driver_id_fkey(id, nombre, apellido, email, telefono_numero, selected_services, driver_type)
      `)
      .eq('is_available', true)
      .order('updated_at', { ascending: false });

    console.log('getOnlineDrivers - data:', data);
    console.log('getOnlineDrivers - error:', error);

    if (error) throw error;

    // Convertir coordenadas de string a número
    const result = (data || []).map(d => ({
      ...d,
      current_latitude: d.current_latitude ? parseFloat(String(d.current_latitude)) : null,
      current_longitude: d.current_longitude ? parseFloat(String(d.current_longitude)) : null,
    }));

    console.log('getOnlineDrivers - result:', result);
    return result;
  },

  // Obtener disponibilidad de un conductor
  async getDriverAvailability(driverId: string): Promise<DriverAvailability | null> {
    const { data, error } = await supabase
      .from('driver_availability')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ============================================
  // TRUST POINTS
  // ============================================

  // Obtener historial de puntos de un conductor
  async getTrustPointsLog(
    driverId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<TrustPointsLog>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('trust_points_log')
      .select('*', { count: 'exact' })
      .eq('driver_id', driverId)
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

  // Agregar puntos manualmente
  async addTrustPoints(
    driverId: string,
    points: number,
    reason: string,
    description: string,
    createdBy: string
  ): Promise<TrustPointsLog> {
    // Obtener puntos actuales
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trust_points')
      .eq('id', driverId)
      .single();

    if (profileError) throw profileError;

    const pointsBefore = profile?.trust_points || 0;
    const pointsAfter = pointsBefore + points;

    // Insertar log
    const { data: log, error: logError } = await supabase
      .from('trust_points_log')
      .insert({
        driver_id: driverId,
        points,
        reason,
        description,
        points_before: pointsBefore,
        points_after: pointsAfter,
        created_by: createdBy,
      })
      .select()
      .single();

    if (logError) throw logError;

    // Actualizar puntos del conductor
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ trust_points: pointsAfter })
      .eq('id', driverId);

    if (updateError) throw updateError;

    return log;
  },

  // ============================================
  // DRIVER STATS
  // ============================================

  // Obtener estadísticas completas de un conductor
  async getDriverStats(driverId: string) {
    const [
      profile,
      documents,
      vehicles,
      availability,
      ridesResult,
      deliveriesResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', driverId).single(),
      supabase.from('driver_documents').select('*').eq('driver_id', driverId),
      supabase.from('driver_vehicles').select('*').eq('driver_id', driverId),
      supabase.from('driver_availability').select('*').eq('driver_id', driverId).single(),
      supabase.from('rides').select('status, actual_price').eq('driver_id', driverId),
      supabase.from('deliveries').select('status, actual_price').eq('driver_id', driverId),
    ]);

    const rides = ridesResult.data || [];
    const deliveries = deliveriesResult.data || [];

    return {
      profile: profile.data,
      documents: documents.data || [],
      vehicles: vehicles.data || [],
      availability: availability.data,
      stats: {
        totalRides: rides.length,
        completedRides: rides.filter(r => r.status === 'completed').length,
        totalDeliveries: deliveries.length,
        completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
        totalEarnings:
          rides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.actual_price || 0), 0) +
          deliveries.filter(d => d.status === 'delivered').reduce((sum, d) => sum + (d.actual_price || 0), 0),
        pendingDocuments: (documents.data || []).filter(d => d.status === 'pending').length,
        approvedDocuments: (documents.data || []).filter(d => d.status === 'approved').length,
        rejectedDocuments: (documents.data || []).filter(d => d.status === 'rejected').length,
      },
    };
  },
};
