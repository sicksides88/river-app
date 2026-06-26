import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { businessService, type Delivery } from '../services/business.service';
import { useNavigate } from 'react-router-dom';
import { Package, Loader2 } from 'lucide-react';

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

const DeliveriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadDeliveries = async (p = 1) => {
    setLoading(true);
    try {
      const result = await businessService.getDeliveries({
        page: p,
        limit: 20,
        status: statusFilter || undefined,
      });
      setDeliveries(result.data);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries(1);
  }, [statusFilter]);

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Envíos</h1>
            <p className="text-gray-500 mt-1">Historial de envíos solicitados</p>
          </div>
          <button
            onClick={() => navigate('/nuevo-envio')}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            + Nuevo envío
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabel).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron envíos</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Tracking</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Destino</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Cadete</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/envios/${d.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900">{d.tracking_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 truncate max-w-[250px]">{d.dropoff_address}</p>
                      <p className="text-xs text-gray-500">{d.dropoff_contact_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[d.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabel[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {d.driver ? (
                        <span className="text-sm text-gray-900">{d.driver.nombre} {d.driver.apellido}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(d.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => loadDeliveries(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => loadDeliveries(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeliveriesPage;
