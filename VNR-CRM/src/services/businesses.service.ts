import { api } from './api';
import type {
  Business,
  BusinessFilters,
  BusinessDeliveryFilters,
  BusinessCharge,
  BusinessChargeFilters,
  Delivery,
  PaginatedResponse,
} from '../types/database';

export const businessesService = {
  // Obtener todos los comercios con paginación y filtros (via API backend para bypass RLS)
  async getAll(
    page = 1,
    limit = 10,
    filters?: BusinessFilters
  ): Promise<PaginatedResponse<Business>> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.is_active !== undefined) params.is_active = String(filters.is_active);

    const { data: result } = await api.get('/admin/businesses', { params });

    return {
      data: result.data || [],
      total: result.total || 0,
      page: result.page || page,
      limit: result.limit || limit,
      totalPages: result.totalPages || 0,
    };
  },

  // Obtener comercio por ID (via API backend)
  async getById(id: string): Promise<Business | null> {
    const { data: result } = await api.get(`/admin/businesses/${id}`);
    return result.business || null;
  },

  // Actualizar comercio (via API backend)
  async update(id: string, updates: Partial<Business>): Promise<Business> {
    const { data: result } = await api.put(`/admin/businesses/${id}`, updates);
    return result.business;
  },

  // Activar/desactivar comercio
  async toggleActive(id: string, is_active: boolean): Promise<Business> {
    return this.update(id, { is_active });
  },

  // Eliminar comercio
  async deleteBusiness(id: string): Promise<void> {
    await api.delete(`/admin/businesses/${id}`);
  },

  // Obtener pedidos de comercios (via API backend para bypass RLS)
  async getBusinessDeliveries(
    page = 1,
    limit = 10,
    filters?: BusinessDeliveryFilters
  ): Promise<PaginatedResponse<Delivery & { business?: Business }>> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (filters?.status) params.status = filters.status;
    if (filters?.business_id) params.business_id = filters.business_id;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;

    const { data: result } = await api.get('/admin/business-deliveries', { params });

    return {
      data: result.data || [],
      total: result.total || 0,
      page: result.page || page,
      limit: result.limit || limit,
      totalPages: result.totalPages || 0,
    };
  },

  // Asignar cadete a pedido (via API backend para notificaciones)
  async assignDriver(deliveryId: string, driverId: string) {
    const { data } = await api.put(`/admin/business-deliveries/${deliveryId}/assign`, {
      driver_id: driverId,
    });
    return data;
  },

  // Obtener cadetes disponibles (via API backend)
  async getAvailableDrivers() {
    const { data } = await api.get('/admin/available-drivers');
    return data.drivers || [];
  },

  // ========== CARGOS / FACTURACIÓN ==========

  // Obtener cargos de comercios (via API backend)
  async getCharges(
    page = 1,
    limit = 20,
    filters?: BusinessChargeFilters
  ): Promise<{
    data: BusinessCharge[];
    totals: { total: number; pending: number; invoiced: number; paid: number };
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (filters?.status) params.status = filters.status;
    if (filters?.business_id) params.business_id = filters.business_id;

    const { data } = await api.get('/admin/business-charges', { params });
    return data;
  },

  // Marcar cargo como facturado
  async invoiceCharge(chargeId: string, invoiceNumber?: string) {
    const { data } = await api.put(`/admin/business-charges/${chargeId}/invoice`, {
      invoice_number: invoiceNumber,
    });
    return data;
  },

  // Marcar cargo como pagado
  async payCharge(chargeId: string) {
    const { data } = await api.put(`/admin/business-charges/${chargeId}/pay`);
    return data;
  },
};
