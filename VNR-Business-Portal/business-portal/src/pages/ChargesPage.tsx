import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { businessService, type BusinessCharge } from '../services/business.service';
import { DollarSign, Clock, CheckCircle2, Loader2 } from 'lucide-react';

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  invoiced: 'Facturado',
  paid: 'Pagado',
};

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  invoiced: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
};

const ChargesPage: React.FC = () => {
  const [charges, setCharges] = useState<BusinessCharge[]>([]);
  const [totals, setTotals] = useState({ total: 0, pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const loadCharges = async (p = 1) => {
    setLoading(true);
    try {
      const result = await businessService.getCharges({
        page: p,
        limit: 20,
        status: statusFilter || undefined,
      });
      setCharges(result.data);
      setTotals(result.totals);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharges(1);
  }, [statusFilter]);

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 mt-1">Cargos por envíos realizados</p>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total acumulado</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${totals.total.toLocaleString('es-AR')}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendiente de pago</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">${totals.pending.toLocaleString('es-AR')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pagado</p>
                <p className="text-2xl font-bold text-green-600 mt-1">${totals.paid.toLocaleString('es-AR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtro */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="invoiced">Facturados</option>
            <option value="paid">Pagados</option>
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : charges.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay cargos aún</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Envío</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Destino</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900">{c.delivery?.tracking_number || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 truncate max-w-[200px]">{c.delivery?.dropoff_address || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">${Number(c.amount).toLocaleString('es-AR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
                        {statusLabel[c.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(c.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => loadCharges(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
                <button
                  onClick={() => loadCharges(page + 1)}
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

export default ChargesPage;
