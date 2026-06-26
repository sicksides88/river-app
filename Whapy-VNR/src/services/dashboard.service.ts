import { supabase } from './supabase';
import type { DashboardStats } from '../types/database';

interface MonthlyRevenueData {
  month: string;
  monthName: string;
  income: number;
  expenses: number;
}

export const dashboardService = {
  // Obtener estadísticas generales del dashboard
  async getStats(): Promise<DashboardStats> {
    const [
      profilesResult,
      ridesResult,
      deliveriesResult,
      documentsResult
    ] = await Promise.all([
      supabase.from('profiles').select('role, driver_status, is_verified'),
      supabase.from('rides').select('status, actual_price, estimated_price'),
      supabase.from('deliveries').select('status, actual_price, estimated_price'),
      supabase.from('driver_documents').select('status'),
    ]);

    const profiles = profilesResult.data || [];
    const rides = ridesResult.data || [];
    const deliveries = deliveriesResult.data || [];
    const documents = documentsResult.data || [];

    const completedRides = rides.filter(r => r.status === 'completed');
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

    const ridesRevenue = completedRides.reduce(
      (sum, r) => sum + (r.actual_price || r.estimated_price || 0),
      0
    );
    const deliveriesRevenue = completedDeliveries.reduce(
      (sum, d) => sum + (d.actual_price || d.estimated_price || 0),
      0
    );

    return {
      totalUsers: profiles.length,
      totalDrivers: profiles.filter(p => p.role === 'driver').length,
      pendingDrivers: profiles.filter(p => p.driver_status === 'pending').length,
      activeDrivers: profiles.filter(p => p.driver_status === 'approved').length,
      totalRides: rides.length,
      completedRides: completedRides.length,
      totalDeliveries: deliveries.length,
      completedDeliveries: completedDeliveries.length,
      totalRevenue: ridesRevenue + deliveriesRevenue,
      pendingDocuments: documents.filter(d => d.status === 'pending').length,
    };
  },

  // Obtener datos para gráficos - Viajes por día (últimos 7 días)
  async getRidesChartData(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('rides')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Agrupar por día
    const chartData: { [key: string]: { total: number; completed: number } } = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      chartData[key] = { total: 0, completed: 0 };
    }

    (data || []).forEach(ride => {
      const key = ride.created_at.split('T')[0];
      if (chartData[key]) {
        chartData[key].total++;
        if (ride.status === 'completed') {
          chartData[key].completed++;
        }
      }
    });

    return Object.entries(chartData)
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        completed: stats.completed,
      }))
      .reverse();
  },

  // Obtener datos para gráficos - Envíos por día (últimos 7 días)
  async getDeliveriesChartData(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('deliveries')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const chartData: { [key: string]: { total: number; delivered: number } } = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      chartData[key] = { total: 0, delivered: 0 };
    }

    (data || []).forEach(delivery => {
      const key = delivery.created_at.split('T')[0];
      if (chartData[key]) {
        chartData[key].total++;
        if (delivery.status === 'delivered') {
          chartData[key].delivered++;
        }
      }
    });

    return Object.entries(chartData)
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        delivered: stats.delivered,
      }))
      .reverse();
  },

  // Obtener distribución por tipo de servicio
  async getServiceDistribution() {
    const [ridesResult, deliveriesResult] = await Promise.all([
      supabase.from('rides').select('service_type'),
      supabase.from('deliveries').select('service_type'),
    ]);

    const rides = ridesResult.data || [];
    const deliveries = deliveriesResult.data || [];

    return {
      vueltaSegura: rides.filter(r => r.service_type === 'vuelta_segura').length,
      chofer: rides.filter(r => r.service_type === 'chofer').length,
      envios: deliveries.filter(d => d.service_type === 'envios').length,
      fletes: deliveries.filter(d => d.service_type === 'fletes').length,
    };
  },

  // Obtener actividad reciente
  async getRecentActivity(limit = 10) {
    const [ridesResult, deliveriesResult] = await Promise.all([
      supabase
        .from('rides')
        .select(`
          id,
          created_at,
          status,
          service_type,
          user:profiles!rides_user_id_fkey(nombre, apellido)
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('deliveries')
        .select(`
          id,
          created_at,
          status,
          service_type,
          tracking_number,
          user:profiles!deliveries_user_id_fkey(nombre, apellido)
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const rides = (ridesResult.data || []).map(r => ({
      ...r,
      type: 'ride' as const,
    }));

    const deliveries = (deliveriesResult.data || []).map(d => ({
      ...d,
      type: 'delivery' as const,
    }));

    // Combinar y ordenar por fecha
    return [...rides, ...deliveries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  // Obtener ingresos y egresos mensuales (últimos 12 meses)
  async getMonthlyRevenue(months = 12): Promise<MonthlyRevenueData[]> {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all data in parallel
    const [ridesResult, deliveriesResult, ordersResult, settlementsResult] = await Promise.all([
      supabase
        .from('rides')
        .select('created_at, actual_price')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('deliveries')
        .select('created_at, actual_price')
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('orders')
        .select('created_at, total')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('driver_settlements')
        .select('created_at, net_amount')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString()),
    ]);

    // Initialize monthly data
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { income: 0, expenses: 0 };
    }

    // Aggregate rides income
    (ridesResult.data || []).forEach(ride => {
      const date = new Date(ride.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].income += ride.actual_price || 0;
      }
    });

    // Aggregate deliveries income
    (deliveriesResult.data || []).forEach(delivery => {
      const date = new Date(delivery.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].income += delivery.actual_price || 0;
      }
    });

    // Aggregate orders income
    (ordersResult.data || []).forEach(order => {
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].income += order.total || 0;
      }
    });

    // Aggregate settlements as expenses
    (settlementsResult.data || []).forEach(settlement => {
      const date = new Date(settlement.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].expenses += settlement.net_amount || 0;
      }
    });

    // Convert to array and sort chronologically
    return Object.entries(monthlyData)
      .map(([key, data]) => {
        const [, month] = key.split('-');
        const monthIndex = parseInt(month) - 1;
        return {
          month: key,
          monthName: monthNames[monthIndex],
          income: data.income,
          expenses: data.expenses,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  // Obtener total de egresos (liquidaciones pagadas)
  async getTotalExpenses(dateFrom?: string, dateTo?: string): Promise<number> {
    let query = supabase
      .from('driver_settlements')
      .select('net_amount')
      .eq('status', 'paid');

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data } = await query;
    return (data || []).reduce((sum, s) => sum + (s.net_amount || 0), 0);
  },

  // Obtener rating promedio de conductores
  async getAverageDriverRating(): Promise<number> {
    const { data } = await supabase
      .from('profiles')
      .select('driver_rating')
      .eq('role', 'driver')
      .not('driver_rating', 'is', null);

    if (!data || data.length === 0) return 0;

    const total = data.reduce((sum, p) => sum + (p.driver_rating || 0), 0);
    return Math.round((total / data.length) * 10) / 10;
  },
};
