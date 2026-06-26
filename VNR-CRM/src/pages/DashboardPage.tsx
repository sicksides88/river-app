import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { dashboardService } from '../services';
import type { DashboardStats } from '../types/database';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Star,
  MoreVertical,
  Loader2,
  Car,
  Package,
  Truck,
  Clock,
} from 'lucide-react';

interface MonthlyData {
  month: string;
  monthName: string;
  income: number;
  expenses: number;
}

interface RecentActivity {
  id: string;
  created_at: string;
  status: string;
  service_type: string;
  type: 'ride' | 'delivery';
  tracking_number?: string;
  user: { nombre: string; apellido: string } | null;
}

interface ServiceDistribution {
  vueltaSegura: number;
  chofer: number;
  envios: number;
  fletes: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statsData,
          monthlyRevenue,
          activity,
          distribution,
          expenses,
          rating,
        ] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getMonthlyRevenue(12),
          dashboardService.getRecentActivity(5),
          dashboardService.getServiceDistribution(),
          dashboardService.getTotalExpenses(),
          dashboardService.getAverageDriverRating(),
        ]);

        setStats(statsData);
        setMonthlyData(monthlyRevenue);
        setRecentActivity(activity as unknown as RecentActivity[]);
        setServiceDistribution(distribution);
        setTotalExpenses(expenses);
        setAvgRating(rating);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vuelta_segura: 'Vuelta Segura',
      chofer: 'Chofer',
      envios: 'Envío',
      fletes: 'Flete',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      delivered: 'Entregado',
      picked_up: 'Recogido',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  const maxIncome = Math.max(...monthlyData.map(d => d.income), 1);
  const totalIncome = stats?.totalRevenue || 0;
  const balance = totalIncome - totalExpenses;
  const growthPercentage = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  // Calculate service distribution percentages
  const totalServices = serviceDistribution
    ? serviceDistribution.vueltaSegura + serviceDistribution.chofer + serviceDistribution.envios + serviceDistribution.fletes
    : 0;

  const getPercentage = (value: number) => {
    if (totalServices === 0) return 0;
    return Math.round((value / totalServices) * 100);
  };

  const distributionData = serviceDistribution ? [
    { name: 'Vuelta Segura', value: serviceDistribution.vueltaSegura, percentage: getPercentage(serviceDistribution.vueltaSegura), color: '#1e3a5f' },
    { name: 'Chofer', value: serviceDistribution.chofer, percentage: getPercentage(serviceDistribution.chofer), color: '#fef3c7' },
    { name: 'Envíos', value: serviceDistribution.envios, percentage: getPercentage(serviceDistribution.envios), color: '#dbeafe' },
    { name: 'Fletes', value: serviceDistribution.fletes, percentage: getPercentage(serviceDistribution.fletes), color: '#d1fae5' },
  ] : [];

  // Calculate stroke dash arrays for pie chart
  const circumference = 2 * Math.PI * 40; // r=40
  let offset = 0;
  const pieSegments = distributionData.map(d => {
    const dashArray = (d.percentage / 100) * circumference;
    const segment = { ...d, dashArray, dashOffset: -offset };
    offset += dashArray;
    return segment;
  });

  return (
    <Layout>
      <div className="p-8 flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Más
              <MoreVertical className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Card principal de ganancias */}
          <div className="bg-gray-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      strokeDasharray={`${(Math.abs(growthPercentage) / 100) * 352} ${352}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="50%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {growthPercentage >= 0 ? '↗' : '↘'} {Math.abs(growthPercentage)}%
                    </span>
                  </div>
                </div>

                {/* Texto de balance */}
                <div>
                  <p className="text-gray-400 text-sm">Balance neto</p>
                  <p className="text-4xl font-bold mt-1">{formatCurrency(balance)}</p>
                </div>
              </div>

              {/* Stats rápidos */}
              <div className="text-right">
                <p className="text-gray-400 text-sm">Total servicios</p>
                <p className="text-2xl font-bold">{(stats?.totalRides || 0) + (stats?.totalDeliveries || 0)}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-2xl p-5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                <ArrowDownLeft className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
              <p className="text-gray-500 text-sm">Ingresos</p>
            </div>

            <div className="bg-red-50 rounded-2xl p-5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
              <p className="text-gray-500 text-sm">Egresos</p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(stats?.completedRides || 0) + (stats?.completedDeliveries || 0)}
              </p>
              <p className="text-gray-500 text-sm">Completados</p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{avgRating || '-'}</p>
              <p className="text-gray-500 text-sm">Puntuación</p>
            </div>
          </div>

          {/* Gráfico de ingresos mensuales */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ingresos mensuales</h3>
              <span className="text-sm text-gray-500">Últimos 12 meses</span>
            </div>

            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Sin datos disponibles
              </div>
            ) : (
              <div className="relative flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-xs text-gray-400 pr-4 h-64">
                  <span>{formatCurrency(maxIncome)}</span>
                  <span>{formatCurrency(maxIncome * 0.66)}</span>
                  <span>{formatCurrency(maxIncome * 0.33)}</span>
                  <span>$0</span>
                </div>

                {/* Bars */}
                <div className="flex-1 flex items-end justify-between h-64 gap-1">
                  {monthlyData.map((item, index) => {
                    const height = maxIncome > 0 ? (item.income / maxIncome) * 200 : 0;
                    const isCurrentMonth = index === monthlyData.length - 1;
                    return (
                      <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                        <div
                          className={`w-full max-w-8 rounded-t-lg transition-all ${
                            isCurrentMonth ? 'bg-gray-900' : 'bg-cyan-400'
                          }`}
                          style={{ height: `${Math.max(height, 4)}px` }}
                          title={`${item.monthName}: ${formatCurrency(item.income)}`}
                        />
                        <span className="text-xs text-gray-500">{item.monthName.substring(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 space-y-6">
          {/* Actividad reciente */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
                <p className="text-sm text-gray-500">Últimos servicios</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Sin actividad reciente</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'ride' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'ride' ? (
                        activity.service_type === 'vuelta_segura' ? (
                          <Car className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Car className="w-4 h-4 text-blue-600" />
                        )
                      ) : (
                        activity.service_type === 'fletes' ? (
                          <Truck className="w-4 h-4 text-green-600" />
                        ) : (
                          <Package className="w-4 h-4 text-green-600" />
                        )
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {getServiceTypeLabel(activity.service_type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.user ? `${activity.user.nombre} ${activity.user.apellido}` : 'Usuario'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activity.status === 'completed' || activity.status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : activity.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusLabel(activity.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className="w-full mt-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Ver más
            </button>
          </div>

          {/* Distribución de servicios */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Distribución de servicios</h3>

            {totalServices === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Sin datos disponibles</p>
            ) : (
              <>
                {/* Pie Chart */}
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {pieSegments.map((segment, index) => (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${segment.dashArray} ${circumference}`}
                        strokeDashoffset={segment.dashOffset}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{totalServices}</span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {distributionData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600">
                        {item.name} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stats de conductores */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Conductores</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Activos</span>
                <span className="font-semibold text-green-600">{stats?.activeDrivers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Pendientes</span>
                <span className="font-semibold text-yellow-600">{stats?.pendingDrivers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Total</span>
                <span className="font-semibold text-gray-900">{stats?.totalDrivers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Docs pendientes</span>
                <span className="font-semibold text-orange-600">{stats?.pendingDocuments || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
