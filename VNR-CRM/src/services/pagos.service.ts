import { supabase } from './supabase';
import type {
  DriverSettlement,
  Transaction,
  PaymentsSummary,
  PaymentFilters,
  SettlementFilters,
  PaginatedResponse,
} from '../types/database';

interface RideWithDriver {
  id: string;
  actual_price: number | null;
  status: string;
  created_at: string;
  service_type: string;
  driver: { id: string; nombre: string; apellido: string } | null;
}

interface DeliveryWithDriver {
  id: string;
  actual_price: number | null;
  status: string;
  created_at: string;
  service_type: string;
  tracking_number: string | null;
  driver: { id: string; nombre: string; apellido: string } | null;
}

interface OrderBasic {
  id: string;
  total: number;
  payment_status: string;
  created_at: string;
  order_number: string;
}

interface SettlementWithDriver {
  id: string;
  driver_id: string;
  reference_type: string;
  reference_id: string;
  gross_amount: number;
  commission_percentage: number;
  commission_amount: number;
  net_amount: number;
  status: string;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  driver: { id: string; nombre: string; apellido: string } | null;
}

export const pagosService = {
  // ============================================
  // AGGREGATED TRANSACTIONS
  // ============================================

  async getTransactions(
    page = 1,
    limit = 20,
    filters?: PaymentFilters
  ): Promise<PaginatedResponse<Transaction>> {
    const transactions: Transaction[] = [];

    // Fetch completed rides (income)
    if (!filters?.type || filters.type === 'income') {
      if (!filters?.source || filters.source === 'ride') {
        let ridesQuery = supabase
          .from('rides')
          .select(
            'id, actual_price, status, created_at, service_type, driver:profiles!rides_driver_id_fkey(id, nombre, apellido)'
          )
          .eq('status', 'completed')
          .not('actual_price', 'is', null);

        if (filters?.date_from) ridesQuery = ridesQuery.gte('created_at', filters.date_from);
        if (filters?.date_to) ridesQuery = ridesQuery.lte('created_at', filters.date_to);

        const { data: rides } = await ridesQuery;

        (rides as RideWithDriver[] | null)?.forEach((ride) => {
          transactions.push({
            id: `ride-${ride.id}`,
            type: 'income',
            source: 'ride',
            source_id: ride.id,
            concept: `${ride.service_type === 'vuelta_segura' ? 'Vuelta Segura' : 'Chofer'} - Viaje`,
            amount: ride.actual_price || 0,
            status: 'completed',
            date: ride.created_at,
            driver_id: ride.driver?.id,
            driver_name: ride.driver
              ? `${ride.driver.nombre} ${ride.driver.apellido}`
              : undefined,
          });
        });
      }
    }

    // Fetch completed deliveries (income)
    if (!filters?.type || filters.type === 'income') {
      if (!filters?.source || filters.source === 'delivery') {
        let deliveriesQuery = supabase
          .from('deliveries')
          .select(
            'id, actual_price, status, created_at, service_type, tracking_number, driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido)'
          )
          .eq('status', 'delivered')
          .not('actual_price', 'is', null);

        if (filters?.date_from)
          deliveriesQuery = deliveriesQuery.gte('created_at', filters.date_from);
        if (filters?.date_to)
          deliveriesQuery = deliveriesQuery.lte('created_at', filters.date_to);

        const { data: deliveries } = await deliveriesQuery;

        (deliveries as DeliveryWithDriver[] | null)?.forEach((delivery) => {
          transactions.push({
            id: `delivery-${delivery.id}`,
            type: 'income',
            source: 'delivery',
            source_id: delivery.id,
            concept: `${delivery.service_type === 'envios' ? 'Envio' : 'Flete'} - ${delivery.tracking_number || 'Sin tracking'}`,
            amount: delivery.actual_price || 0,
            status: 'completed',
            date: delivery.created_at,
            driver_id: delivery.driver?.id,
            driver_name: delivery.driver
              ? `${delivery.driver.nombre} ${delivery.driver.apellido}`
              : undefined,
          });
        });
      }
    }

    // Fetch paid orders (income)
    if (!filters?.type || filters.type === 'income') {
      if (!filters?.source || filters.source === 'order') {
        let ordersQuery = supabase
          .from('orders')
          .select('id, total, payment_status, created_at, order_number')
          .eq('payment_status', 'paid');

        if (filters?.date_from) ordersQuery = ordersQuery.gte('created_at', filters.date_from);
        if (filters?.date_to) ordersQuery = ordersQuery.lte('created_at', filters.date_to);

        const { data: orders } = await ordersQuery;

        (orders as OrderBasic[] | null)?.forEach((order) => {
          transactions.push({
            id: `order-${order.id}`,
            type: 'income',
            source: 'order',
            source_id: order.id,
            concept: `Pedido #${order.order_number}`,
            amount: order.total || 0,
            status: 'completed',
            date: order.created_at,
          });
        });
      }
    }

    // Fetch driver settlements (expenses)
    if (!filters?.type || filters.type === 'expense') {
      if (!filters?.source || filters.source === 'settlement') {
        let settlementsQuery = supabase
          .from('driver_settlements')
          .select(
            '*, driver:profiles!driver_settlements_driver_id_fkey(id, nombre, apellido)'
          );

        if (filters?.status === 'pending') {
          settlementsQuery = settlementsQuery.eq('status', 'pending');
        } else if (filters?.status === 'completed') {
          settlementsQuery = settlementsQuery.eq('status', 'paid');
        }
        if (filters?.date_from)
          settlementsQuery = settlementsQuery.gte('created_at', filters.date_from);
        if (filters?.date_to)
          settlementsQuery = settlementsQuery.lte('created_at', filters.date_to);
        if (filters?.driver_id)
          settlementsQuery = settlementsQuery.eq('driver_id', filters.driver_id);

        const { data: settlements } = await settlementsQuery;

        (settlements as SettlementWithDriver[] | null)?.forEach((settlement) => {
          transactions.push({
            id: `settlement-${settlement.id}`,
            type: 'expense',
            source: 'settlement',
            source_id: settlement.id,
            concept: `Pago conductor - ${settlement.driver?.nombre || ''} ${settlement.driver?.apellido || ''}`,
            amount: settlement.net_amount,
            status: settlement.status === 'paid' ? 'completed' : 'pending',
            date: settlement.created_at,
            driver_id: settlement.driver_id,
            driver_name: settlement.driver
              ? `${settlement.driver.nombre} ${settlement.driver.apellido}`
              : undefined,
          });
        });
      }
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply status filter if specified
    let filtered = transactions;
    if (filters?.status) {
      filtered = transactions.filter((t) => t.status === filters.status);
    }

    // Paginate
    const total = filtered.length;
    const from = (page - 1) * limit;
    const paginated = filtered.slice(from, from + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ============================================
  // SUMMARY CALCULATIONS
  // ============================================

  async getSummary(filters?: { date_from?: string; date_to?: string }): Promise<PaymentsSummary> {
    // Get completed rides income
    let ridesQuery = supabase
      .from('rides')
      .select('actual_price')
      .eq('status', 'completed')
      .not('actual_price', 'is', null);

    if (filters?.date_from) ridesQuery = ridesQuery.gte('created_at', filters.date_from);
    if (filters?.date_to) ridesQuery = ridesQuery.lte('created_at', filters.date_to);

    const { data: rides } = await ridesQuery;
    const ridesIncome =
      (rides as { actual_price: number }[] | null)?.reduce(
        (sum, r) => sum + (r.actual_price || 0),
        0
      ) || 0;

    // Get completed deliveries income
    let deliveriesQuery = supabase
      .from('deliveries')
      .select('actual_price')
      .eq('status', 'delivered')
      .not('actual_price', 'is', null);

    if (filters?.date_from) deliveriesQuery = deliveriesQuery.gte('created_at', filters.date_from);
    if (filters?.date_to) deliveriesQuery = deliveriesQuery.lte('created_at', filters.date_to);

    const { data: deliveries } = await deliveriesQuery;
    const deliveriesIncome =
      (deliveries as { actual_price: number }[] | null)?.reduce(
        (sum, d) => sum + (d.actual_price || 0),
        0
      ) || 0;

    // Get paid orders income
    let ordersQuery = supabase.from('orders').select('total').eq('payment_status', 'paid');

    if (filters?.date_from) ordersQuery = ordersQuery.gte('created_at', filters.date_from);
    if (filters?.date_to) ordersQuery = ordersQuery.lte('created_at', filters.date_to);

    const { data: orders } = await ordersQuery;
    const ordersIncome =
      (orders as { total: number }[] | null)?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    const totalIncome = ridesIncome + deliveriesIncome + ordersIncome;

    // Get settlements (paid = expenses, pending = pending payments)
    let settlementsQuery = supabase.from('driver_settlements').select('net_amount, status');

    if (filters?.date_from) settlementsQuery = settlementsQuery.gte('created_at', filters.date_from);
    if (filters?.date_to) settlementsQuery = settlementsQuery.lte('created_at', filters.date_to);

    const { data: settlements } = await settlementsQuery;

    const totalExpenses =
      (settlements as { net_amount: number; status: string }[] | null)
        ?.filter((s) => s.status === 'paid')
        .reduce((sum, s) => sum + (s.net_amount || 0), 0) || 0;

    const pendingPayments =
      (settlements as { net_amount: number; status: string }[] | null)
        ?.filter((s) => s.status === 'pending')
        .reduce((sum, s) => sum + (s.net_amount || 0), 0) || 0;

    return {
      totalIncome,
      totalExpenses,
      pendingPayments,
      balance: totalIncome - totalExpenses - pendingPayments,
    };
  },

  // ============================================
  // DRIVER SETTLEMENTS
  // ============================================

  async getSettlements(
    page = 1,
    limit = 20,
    filters?: SettlementFilters
  ): Promise<PaginatedResponse<DriverSettlement>> {
    let query = supabase
      .from('driver_settlements')
      .select(
        '*, driver:profiles!driver_settlements_driver_id_fkey(id, nombre, apellido, email)',
        { count: 'exact' }
      );

    if (filters?.driver_id) query = query.eq('driver_id', filters.driver_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.date_from) query = query.gte('created_at', filters.date_from);
    if (filters?.date_to) query = query.lte('created_at', filters.date_to);

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

  async markSettlementPaid(
    id: string,
    paidBy: string,
    notes?: string
  ): Promise<DriverSettlement> {
    const { data, error } = await supabase
      .from('driver_settlements')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: paidBy,
        notes: notes || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMultipleSettlementsPaid(ids: string[], paidBy: string): Promise<void> {
    const { error } = await supabase
      .from('driver_settlements')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: paidBy,
      })
      .in('id', ids);

    if (error) throw error;
  },

  // ============================================
  // CSV EXPORT
  // ============================================

  async exportToCSV(filters?: PaymentFilters): Promise<string> {
    const { data: transactions } = await this.getTransactions(1, 10000, filters);

    const headers = ['Fecha', 'Tipo', 'Fuente', 'Concepto', 'Monto', 'Estado', 'Conductor'];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString('es-AR'),
      t.type === 'income' ? 'Ingreso' : 'Egreso',
      t.source,
      `"${t.concept}"`,
      t.amount.toFixed(2),
      t.status === 'completed' ? 'Completado' : 'Pendiente',
      t.driver_name || '-',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    return csv;
  },

  // ============================================
  // HELPER: Download CSV
  // ============================================

  downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
