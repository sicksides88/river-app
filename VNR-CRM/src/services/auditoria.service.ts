import { supabase } from './supabase';
import type {
  AuditLog,
  AuditLogFilters,
  AuditActionType,
  AuditEntityType,
  PaginatedResponse,
} from '../types/database';

export const auditoriaService = {
  // ============================================
  // LOG CREATION (Called from other services)
  // ============================================

  async log(params: {
    userId: string;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    description: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: params.userId,
        action_type: params.actionType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        description: params.description,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================
  // LOG QUERIES
  // ============================================

  async getLogs(
    page = 1,
    limit = 20,
    filters?: AuditLogFilters
  ): Promise<PaginatedResponse<AuditLog>> {
    let query = supabase
      .from('audit_logs')
      .select(
        '*, user:profiles!audit_logs_user_id_fkey(id, nombre, apellido, email)',
        { count: 'exact' }
      );

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.action_type) {
      query = query.eq('action_type', filters.action_type);
    }
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`);
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

  async getLogById(id: string): Promise<AuditLog | null> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, user:profiles!audit_logs_user_id_fkey(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================
  // HELPER: Get unique users who have audit logs
  // ============================================

  async getAuditUsers(): Promise<Array<{ id: string; nombre: string; apellido: string }>> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('user:profiles!audit_logs_user_id_fkey(id, nombre, apellido)')
      .not('user_id', 'is', null);

    if (error) throw error;

    // Deduplicate
    const uniqueUsers = new Map<string, { id: string; nombre: string; apellido: string }>();
    data?.forEach((log) => {
      const user = log.user as unknown as { id: string; nombre: string; apellido: string } | null;
      if (user && !uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, user);
      }
    });

    return Array.from(uniqueUsers.values());
  },

  // ============================================
  // ACTION TYPE LABELS (for UI)
  // ============================================

  getActionTypeLabel(actionType: AuditActionType): string {
    const labels: Record<AuditActionType, string> = {
      driver_approved: 'Conductor aprobado',
      driver_rejected: 'Conductor rechazado',
      driver_suspended: 'Conductor suspendido',
      driver_reactivated: 'Conductor reactivado',
      document_approved: 'Documento aprobado',
      document_rejected: 'Documento rechazado',
      user_suspended: 'Usuario suspendido',
      user_reactivated: 'Usuario reactivado',
      rate_created: 'Tarifa creada',
      rate_updated: 'Tarifa actualizada',
      rate_deleted: 'Tarifa eliminada',
      rule_created: 'Regla creada',
      rule_updated: 'Regla actualizada',
      rule_deleted: 'Regla eliminada',
      order_status_changed: 'Estado de pedido cambiado',
      ride_cancelled: 'Viaje cancelado',
      delivery_cancelled: 'Envio cancelado',
      settlement_paid: 'Liquidacion pagada',
    };
    return labels[actionType] || actionType;
  },

  // ============================================
  // ACTION TYPE COLOR (for UI badges)
  // ============================================

  getActionTypeColor(actionType: AuditActionType): string {
    const colors: Record<string, string> = {
      driver_approved: 'bg-green-100 text-green-800',
      document_approved: 'bg-green-100 text-green-800',
      driver_rejected: 'bg-red-100 text-red-800',
      document_rejected: 'bg-red-100 text-red-800',
      driver_suspended: 'bg-red-100 text-red-800',
      user_suspended: 'bg-red-100 text-red-800',
      driver_reactivated: 'bg-blue-100 text-blue-800',
      user_reactivated: 'bg-blue-100 text-blue-800',
      rate_created: 'bg-purple-100 text-purple-800',
      rule_created: 'bg-purple-100 text-purple-800',
      rate_updated: 'bg-yellow-100 text-yellow-800',
      rule_updated: 'bg-yellow-100 text-yellow-800',
      rate_deleted: 'bg-gray-100 text-gray-800',
      rule_deleted: 'bg-gray-100 text-gray-800',
      order_status_changed: 'bg-blue-100 text-blue-800',
      ride_cancelled: 'bg-orange-100 text-orange-800',
      delivery_cancelled: 'bg-orange-100 text-orange-800',
      settlement_paid: 'bg-green-100 text-green-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  },

  // ============================================
  // ALL ACTION TYPES (for filter dropdown)
  // ============================================

  getAllActionTypes(): Array<{ value: AuditActionType; label: string }> {
    const types: AuditActionType[] = [
      'driver_approved',
      'driver_rejected',
      'driver_suspended',
      'driver_reactivated',
      'document_approved',
      'document_rejected',
      'user_suspended',
      'user_reactivated',
      'rate_created',
      'rate_updated',
      'rate_deleted',
      'rule_created',
      'rule_updated',
      'rule_deleted',
      'order_status_changed',
      'ride_cancelled',
      'delivery_cancelled',
      'settlement_paid',
    ];
    return types.map((type) => ({
      value: type,
      label: this.getActionTypeLabel(type),
    }));
  },
};
