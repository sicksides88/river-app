import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { pagosService } from '../services';
import { useToast } from '../context/ToastContext';
import type { Transaction, PaymentsSummary, PaymentFilters, TransactionType } from '../types/database';

const PagosPage: React.FC = () => {
  const toast = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    pendingPayments: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Filters
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [transResult, summaryResult] = await Promise.all([
        pagosService.getTransactions(page, limit, filters),
        pagosService.getSummary({
          date_from: filters.date_from,
          date_to: filters.date_to,
        }),
      ]);
      setTransactions(transResult.data);
      setTotalPages(transResult.totalPages);
      setTotal(transResult.total);
      setSummary(summaryResult);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const handleFilter = () => {
    const newFilters: PaymentFilters = {};
    if (typeFilter) newFilters.type = typeFilter as TransactionType;
    if (statusFilter) newFilters.status = statusFilter as 'completed' | 'pending';
    if (dateFrom) newFilters.date_from = dateFrom;
    if (dateTo) newFilters.date_to = dateTo;
    setFilters(newFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setFilters({});
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const csv = await pagosService.exportToCSV(filters);
      const filename = `pagos_${new Date().toISOString().split('T')[0]}.csv`;
      pagosService.downloadCSV(csv, filename);
      toast.success('Exportación completada');
    } catch (err) {
      console.error('Error exporting:', err);
      toast.error('Error al exportar');
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Layout title="Pagos">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seguimiento de ingresos, egresos y liquidaciones
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Resumen de pagos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-600 text-sm">Ingresos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatCurrency(summary.totalIncome)}
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-gray-600 text-sm">Egresos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatCurrency(summary.totalExpenses)}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-gray-600 text-sm">Pendiente</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatCurrency(summary.pendingPayments)}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-600 text-sm">Balance</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatCurrency(summary.balance)}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[140px]"
                >
                  <option value="">Todos</option>
                  <option value="income">Ingresos</option>
                  <option value="expense">Egresos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[140px]"
                >
                  <option value="">Todos</option>
                  <option value="completed">Completado</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Filtrar
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Limpiar
              </button>
              <div className="ml-auto">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de transacciones */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay transacciones</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{tx.concept}</span>
                          {tx.driver_name && (
                            <p className="text-xs text-gray-500">{tx.driver_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tx.status === 'completed' ? 'Completado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {!loading && transactions.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}{' '}
                transacciones
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        page === pageNum
                          ? 'bg-black text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="px-2 py-1">...</span>}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PagosPage;
