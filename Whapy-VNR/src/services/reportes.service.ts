import { supabase } from './supabase';

export interface ReportKPIs {
  totalRides: number;
  totalDeliveries: number;
  newUsers: number;
  activeDrivers: number;
  totalRevenue: number;
  // Previous period for comparison
  prevRides: number;
  prevDeliveries: number;
  prevUsers: number;
  prevDrivers: number;
  prevRevenue: number;
}

export interface ServiceRevenue {
  service: string;
  label: string;
  revenue: number;
  count: number;
  color: string;
}

export interface TrendData {
  date: string;
  rides: number;
  deliveries: number;
}

export interface TopDriver {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  totalTrips: number;
  totalRevenue: number;
  rating: number;
}

export const reportesService = {
  // Get date range based on period
  getDateRange(period: string): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    let from: Date;
    let prevFrom: Date;
    let prevTo: Date;

    switch (period) {
      case '7days':
        from = new Date(now);
        from.setDate(from.getDate() - 7);
        prevTo = new Date(from);
        prevFrom = new Date(prevTo);
        prevFrom.setDate(prevFrom.getDate() - 7);
        break;
      case '3months':
        from = new Date(now);
        from.setMonth(from.getMonth() - 3);
        prevTo = new Date(from);
        prevFrom = new Date(prevTo);
        prevFrom.setMonth(prevFrom.getMonth() - 3);
        break;
      case 'year':
        from = new Date(now);
        from.setFullYear(from.getFullYear() - 1);
        prevTo = new Date(from);
        prevFrom = new Date(prevTo);
        prevFrom.setFullYear(prevFrom.getFullYear() - 1);
        break;
      case 'month':
      default:
        from = new Date(now);
        from.setMonth(from.getMonth() - 1);
        prevTo = new Date(from);
        prevFrom = new Date(prevTo);
        prevFrom.setMonth(prevFrom.getMonth() - 1);
        break;
    }

    from.setHours(0, 0, 0, 0);
    prevFrom.setHours(0, 0, 0, 0);
    prevTo.setHours(23, 59, 59, 999);

    return { from, to, prevFrom, prevTo };
  },

  // Get KPIs with period comparison
  async getKPIs(period = 'month'): Promise<ReportKPIs> {
    const { from, to, prevFrom, prevTo } = this.getDateRange(period);

    // Current period queries
    const [
      ridesResult,
      deliveriesResult,
      usersResult,
      driversResult,
      // Previous period
      prevRidesResult,
      prevDeliveriesResult,
      prevUsersResult,
      prevDriversResult,
    ] = await Promise.all([
      // Current period
      supabase
        .from('rides')
        .select('id, actual_price, status')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase
        .from('deliveries')
        .select('id, actual_price, status')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase
        .from('profiles')
        .select('id')
        .eq('role', 'user')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase
        .from('profiles')
        .select('id')
        .eq('role', 'driver')
        .eq('driver_status', 'approved'),
      // Previous period
      supabase
        .from('rides')
        .select('id, actual_price, status')
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', prevTo.toISOString()),
      supabase
        .from('deliveries')
        .select('id, actual_price, status')
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', prevTo.toISOString()),
      supabase
        .from('profiles')
        .select('id')
        .eq('role', 'user')
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', prevTo.toISOString()),
      supabase
        .from('profiles')
        .select('id')
        .eq('role', 'driver')
        .eq('driver_status', 'approved')
        .lte('created_at', prevTo.toISOString()),
    ]);

    const rides = ridesResult.data || [];
    const deliveries = deliveriesResult.data || [];
    const prevRides = prevRidesResult.data || [];
    const prevDeliveries = prevDeliveriesResult.data || [];

    const completedRides = rides.filter(r => r.status === 'completed');
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
    const prevCompletedRides = prevRides.filter(r => r.status === 'completed');
    const prevCompletedDeliveries = prevDeliveries.filter(d => d.status === 'delivered');

    const currentRevenue =
      completedRides.reduce((sum, r) => sum + (r.actual_price || 0), 0) +
      completedDeliveries.reduce((sum, d) => sum + (d.actual_price || 0), 0);

    const prevRevenue =
      prevCompletedRides.reduce((sum, r) => sum + (r.actual_price || 0), 0) +
      prevCompletedDeliveries.reduce((sum, d) => sum + (d.actual_price || 0), 0);

    return {
      totalRides: rides.length,
      totalDeliveries: deliveries.length,
      newUsers: usersResult.data?.length || 0,
      activeDrivers: driversResult.data?.length || 0,
      totalRevenue: currentRevenue,
      prevRides: prevRides.length,
      prevDeliveries: prevDeliveries.length,
      prevUsers: prevUsersResult.data?.length || 0,
      prevDrivers: prevDriversResult.data?.length || 0,
      prevRevenue: prevRevenue,
    };
  },

  // Get revenue by service type
  async getRevenueByService(period = 'month'): Promise<ServiceRevenue[]> {
    const { from, to } = this.getDateRange(period);

    const [ridesResult, deliveriesResult] = await Promise.all([
      supabase
        .from('rides')
        .select('service_type, actual_price')
        .eq('status', 'completed')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase
        .from('deliveries')
        .select('service_type, actual_price')
        .eq('status', 'delivered')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
    ]);

    const rides = ridesResult.data || [];
    const deliveries = deliveriesResult.data || [];

    const serviceData: Record<string, { revenue: number; count: number }> = {
      vuelta_segura: { revenue: 0, count: 0 },
      chofer: { revenue: 0, count: 0 },
      envios: { revenue: 0, count: 0 },
      fletes: { revenue: 0, count: 0 },
    };

    rides.forEach(r => {
      const type = r.service_type || 'chofer';
      if (serviceData[type]) {
        serviceData[type].revenue += r.actual_price || 0;
        serviceData[type].count++;
      }
    });

    deliveries.forEach(d => {
      const type = d.service_type || 'envios';
      if (serviceData[type]) {
        serviceData[type].revenue += d.actual_price || 0;
        serviceData[type].count++;
      }
    });

    const colors: Record<string, string> = {
      vuelta_segura: '#3b82f6',
      chofer: '#8b5cf6',
      envios: '#06b6d4',
      fletes: '#f97316',
    };

    const labels: Record<string, string> = {
      vuelta_segura: 'Vuelta Segura',
      chofer: 'Chofer',
      envios: 'Envíos',
      fletes: 'Fletes',
    };

    return Object.entries(serviceData).map(([service, data]) => ({
      service,
      label: labels[service] || service,
      revenue: data.revenue,
      count: data.count,
      color: colors[service] || '#gray',
    }));
  },

  // Get trend data for the period
  async getTrendData(period = 'month'): Promise<TrendData[]> {
    const { from, to } = this.getDateRange(period);

    const [ridesResult, deliveriesResult] = await Promise.all([
      supabase
        .from('rides')
        .select('created_at')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase
        .from('deliveries')
        .select('created_at')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
    ]);

    const rides = ridesResult.data || [];
    const deliveries = deliveriesResult.data || [];

    // Group by date
    const trendMap: Record<string, { rides: number; deliveries: number }> = {};

    // Initialize all dates in range
    const current = new Date(from);
    while (current <= to) {
      const key = current.toISOString().split('T')[0];
      trendMap[key] = { rides: 0, deliveries: 0 };
      current.setDate(current.getDate() + 1);
    }

    rides.forEach(r => {
      const key = r.created_at.split('T')[0];
      if (trendMap[key]) {
        trendMap[key].rides++;
      }
    });

    deliveries.forEach(d => {
      const key = d.created_at.split('T')[0];
      if (trendMap[key]) {
        trendMap[key].deliveries++;
      }
    });

    return Object.entries(trendMap)
      .map(([date, data]) => ({
        date,
        rides: data.rides,
        deliveries: data.deliveries,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Get top drivers by trips and revenue
  async getTopDrivers(limit = 5, period = 'month'): Promise<TopDriver[]> {
    const { from, to } = this.getDateRange(period);

    // Get all completed rides with driver info
    const { data: rides } = await supabase
      .from('rides')
      .select(`
        driver_id,
        actual_price,
        driver:profiles!rides_driver_id_fkey(id, nombre, apellido, avatar_url, driver_rating)
      `)
      .eq('status', 'completed')
      .not('driver_id', 'is', null)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString());

    // Get all completed deliveries with driver info
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select(`
        driver_id,
        actual_price,
        driver:profiles!deliveries_driver_id_fkey(id, nombre, apellido, avatar_url, driver_rating)
      `)
      .eq('status', 'delivered')
      .not('driver_id', 'is', null)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString());

    // Aggregate by driver
    const driverStats: Record<string, {
      id: string;
      nombre: string;
      apellido: string;
      avatar_url: string | null;
      rating: number;
      trips: number;
      revenue: number;
    }> = {};

    interface RideWithDriver {
      driver_id: string;
      actual_price: number | null;
      driver: {
        id: string;
        nombre: string;
        apellido: string;
        avatar_url: string | null;
        driver_rating: number | null;
      } | null;
    }

    (rides as unknown as RideWithDriver[] || []).forEach(r => {
      if (!r.driver_id || !r.driver) return;

      if (!driverStats[r.driver_id]) {
        driverStats[r.driver_id] = {
          id: r.driver_id,
          nombre: r.driver.nombre || '',
          apellido: r.driver.apellido || '',
          avatar_url: r.driver.avatar_url,
          rating: r.driver.driver_rating || 0,
          trips: 0,
          revenue: 0,
        };
      }
      driverStats[r.driver_id].trips++;
      driverStats[r.driver_id].revenue += r.actual_price || 0;
    });

    (deliveries as unknown as RideWithDriver[] || []).forEach(d => {
      if (!d.driver_id || !d.driver) return;

      if (!driverStats[d.driver_id]) {
        driverStats[d.driver_id] = {
          id: d.driver_id,
          nombre: d.driver.nombre || '',
          apellido: d.driver.apellido || '',
          avatar_url: d.driver.avatar_url,
          rating: d.driver.driver_rating || 0,
          trips: 0,
          revenue: 0,
        };
      }
      driverStats[d.driver_id].trips++;
      driverStats[d.driver_id].revenue += d.actual_price || 0;
    });

    // Sort by trips and take top N
    return Object.values(driverStats)
      .sort((a, b) => b.trips - a.trips)
      .slice(0, limit)
      .map(d => ({
        id: d.id,
        nombre: d.nombre,
        apellido: d.apellido,
        avatar_url: d.avatar_url,
        totalTrips: d.trips,
        totalRevenue: d.revenue,
        rating: d.rating,
      }));
  },

  // Calculate percentage change
  calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  },
};
