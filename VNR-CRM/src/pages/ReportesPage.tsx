import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { TrendingUp, TrendingDown, Download, Loader2, User } from 'lucide-react';
import {
  reportesService,
  type ReportKPIs,
  type ServiceRevenue,
  type TrendData,
  type TopDriver,
} from '../services';
import { useToast } from '../context/ToastContext';

type PeriodType = 'month' | '7days' | '3months' | 'year';

const ReportesPage: React.FC = () => {
  const toast = useToast();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [kpis, setKpis] = useState<ReportKPIs | null>(null);
  const [serviceRevenue, setServiceRevenue] = useState<ServiceRevenue[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpisData, revenueData, trend, drivers] = await Promise.all([
        reportesService.getKPIs(period),
        reportesService.getRevenueByService(period),
        reportesService.getTrendData(period),
        reportesService.getTopDrivers(5, period),
      ]);

      setKpis(kpisData);
      setServiceRevenue(revenueData);
      setTrendData(trend);
      setTopDrivers(drivers);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleExport = async () => {
    try {
      setExporting(true);

      // Generate CSV
      const headers = ['Métrica', 'Valor', 'Período anterior', 'Cambio %'];
      const rows = [
        ['Viajes totales', kpis?.totalRides || 0, kpis?.prevRides || 0, reportesService.calculateChange(kpis?.totalRides || 0, kpis?.prevRides || 0)],
        ['Envíos totales', kpis?.totalDeliveries || 0, kpis?.prevDeliveries || 0, reportesService.calculateChange(kpis?.totalDeliveries || 0, kpis?.prevDeliveries || 0)],
        ['Nuevos usuarios', kpis?.newUsers || 0, kpis?.prevUsers || 0, reportesService.calculateChange(kpis?.newUsers || 0, kpis?.prevUsers || 0)],
        ['Conductores activos', kpis?.activeDrivers || 0, kpis?.prevDrivers || 0, reportesService.calculateChange(kpis?.activeDrivers || 0, kpis?.prevDrivers || 0)],
        ['Ingresos totales', kpis?.totalRevenue || 0, kpis?.prevRevenue || 0, reportesService.calculateChange(kpis?.totalRevenue || 0, kpis?.prevRevenue || 0)],
      ];

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.join(',') + '\n';
      });

      csv += '\nIngresos por servicio\n';
      csv += 'Servicio,Cantidad,Ingresos\n';
      serviceRevenue.forEach(s => {
        csv += `${s.label},${s.count},${s.revenue}\n`;
      });

      csv += '\nTop 5 Conductores\n';
      csv += 'Posición,Nombre,Viajes,Ingresos,Rating\n';
      topDrivers.forEach((d, i) => {
        csv += `${i + 1},${d.nombre} ${d.apellido},${d.totalTrips},${d.totalRevenue},${d.rating}\n`;
      });

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Reporte exportado correctamente');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = reportesService.calculateChange(current, previous);
    const isPositive = change >= 0;

    return (
      <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {isPositive ? '+' : ''}{change}%
      </span>
    );
  };

  // Calculate max values for charts
  const maxRevenue = Math.max(...serviceRevenue.map(s => s.revenue), 1);
  const maxTrend = Math.max(...trendData.map(t => t.rides + t.deliveries), 1);

  // Sample trend data for visualization (show last 7 points for cleaner chart)
  const displayTrend = trendData.length > 14
    ? trendData.filter((_, i) => i % Math.ceil(trendData.length / 14) === 0)
    : trendData;

  return (
    <Layout title="Reportes">
      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 mt-1">Análisis de rendimiento del negocio</p>
        </div>

        <div className="space-y-6">
          {/* Filtros de fecha */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
              >
                <option value="7days">Últimos 7 días</option>
                <option value="month">Último mes</option>
                <option value="3months">Últimos 3 meses</option>
                <option value="year">Último año</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Exportar CSV
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* KPIs principales */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-500 text-sm">Viajes totales</span>
                    {kpis && getChangeIndicator(kpis.totalRides, kpis.prevRides)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.totalRides.toLocaleString() || 0}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-500 text-sm">Envíos totales</span>
                    {kpis && getChangeIndicator(kpis.totalDeliveries, kpis.prevDeliveries)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.totalDeliveries.toLocaleString() || 0}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-500 text-sm">Nuevos usuarios</span>
                    {kpis && getChangeIndicator(kpis.newUsers, kpis.prevUsers)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.newUsers.toLocaleString() || 0}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-500 text-sm">Conductores activos</span>
                    {kpis && getChangeIndicator(kpis.activeDrivers, kpis.prevDrivers)}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.activeDrivers.toLocaleString() || 0}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-gray-500 text-sm">Ingresos</span>
                    {kpis && getChangeIndicator(kpis.totalRevenue, kpis.prevRevenue)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(kpis?.totalRevenue || 0)}
                  </p>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingresos por servicio */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Servicio</h3>

                  {serviceRevenue.every(s => s.revenue === 0) ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      Sin datos en este período
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {serviceRevenue.map((service) => (
                          <div key={service.service}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">{service.label}</span>
                              <span className="font-medium">{formatCurrency(service.revenue)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all"
                                style={{
                                  width: `${(service.revenue / maxRevenue) * 100}%`,
                                  backgroundColor: service.color,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{service.count} servicios</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center gap-4 mt-6">
                        {serviceRevenue.map((service) => (
                          <div key={service.service} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: service.color }}
                            />
                            <span className="text-sm text-gray-600">{service.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Tendencia de servicios */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Servicios</h3>

                  {trendData.every(t => t.rides === 0 && t.deliveries === 0) ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      Sin datos en este período
                    </div>
                  ) : (
                    <>
                      <div className="h-48 flex items-end gap-1">
                        {displayTrend.map((day, index) => {
                          const total = day.rides + day.deliveries;
                          const height = maxTrend > 0 ? (total / maxTrend) * 100 : 0;
                          const rideHeight = total > 0 ? (day.rides / total) * height : 0;
                          const deliveryHeight = total > 0 ? (day.deliveries / total) * height : 0;

                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col justify-end"
                              title={`${day.date}: ${day.rides} viajes, ${day.deliveries} envíos`}
                            >
                              <div
                                className="bg-blue-400 rounded-t"
                                style={{ height: `${rideHeight}%`, minHeight: day.rides > 0 ? '4px' : 0 }}
                              />
                              <div
                                className="bg-green-400"
                                style={{ height: `${deliveryHeight}%`, minHeight: day.deliveries > 0 ? '4px' : 0 }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{displayTrend[0]?.date.split('-').slice(1).join('/')}</span>
                        <span>{displayTrend[displayTrend.length - 1]?.date.split('-').slice(1).join('/')}</span>
                      </div>

                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400" />
                          <span className="text-sm text-gray-600">Viajes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                          <span className="text-sm text-gray-600">Envíos</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Top conductores */}
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Top 5 Conductores</h3>
                </div>

                {topDrivers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Sin datos de conductores en este período
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicios</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calificación</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topDrivers.map((driver, index) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : index === 1
                                    ? 'bg-gray-200 text-gray-800'
                                    : index === 2
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {driver.avatar_url ? (
                                  <img
                                    src={driver.avatar_url}
                                    alt=""
                                    className="w-8 h-8 rounded-full mr-3 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                  </div>
                                )}
                                <span className="font-medium text-gray-900">
                                  {driver.nombre} {driver.apellido}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {driver.totalTrips}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {formatCurrency(driver.totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {driver.rating > 0 ? (
                                <span className="flex items-center text-yellow-600">
                                  <span className="mr-1">⭐</span>
                                  {driver.rating.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportesPage;
