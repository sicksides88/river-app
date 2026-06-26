import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { businessService, type Delivery } from '../services/business.service';
import { useAuth } from '../context/AuthContext';
import { Package, Truck, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await businessService.getDeliveries({ limit: 100 });
      setDeliveries(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    active: deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status)).length,
    deliveredToday: deliveries.filter(d => {
      if (d.status !== 'delivered') return false;
      const today = new Date().toDateString();
      return new Date(d.updated_at).toDateString() === today;
    }).length,
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
  };

  const recentDeliveries = deliveries.slice(0, 5);

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    arrived_pickup: 'En origen',
    picked_up: 'Recogido',
    in_transit: 'En camino',
    arrived_dropoff: 'En destino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    arrived_pickup: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    in_transit: 'bg-purple-100 text-purple-800',
    arrived_dropoff: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {business?.name}</h1>
          <p className="text-gray-500 mt-1">Resumen de tus envíos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Envíos activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Entregados hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.deliveredToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total envíos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/nuevo-envio')}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            + Solicitar nuevo envío
          </button>
        </div>

        {/* Recent deliveries */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Últimos envíos</h2>
          </div>
          {recentDeliveries.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tenés envíos aún</p>
              <button
                onClick={() => navigate('/nuevo-envio')}
                className="mt-4 text-sm text-gray-900 font-medium hover:underline"
              >
                Crear tu primer envío
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentDeliveries.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/envios/${d.id}`)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.dropoff_address}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[d.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabel[d.status] || d.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{d.tracking_number}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-4">
                    {new Date(d.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
