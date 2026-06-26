import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable } from '../components/common';
import { businessesService } from '../services';
import type { BusinessCharge, BusinessChargeFilters, Business } from '../types/database';
import { DollarSign, Clock, CheckCircle2, FileText, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

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

const FacturacionComerciosPage: React.FC = () => {
  const [charges, setCharges] = useState<BusinessCharge[]>([]);
  const [totals, setTotals] = useState({ total: 0, pending: 0, invoiced: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<BusinessChargeFilters>({});
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // Modal para facturar
  const [invoiceModal, setInvoiceModal] = useState<{ chargeId: string; businessName: string } | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const loadCharges = async (p = 1) => {
    setLoading(true);
    try {
      const result = await businessesService.getCharges(p, 20, filters);
      setCharges(result.data);
      setTotals(result.totals);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error cargando cargos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const result = await businessesService.getAll(1, 100);
      setBusinesses(result.data);
    } catch (error) {
      console.error('Error cargando comercios:', error);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    loadCharges(1);
  }, [filters]);

  const handleInvoice = async () => {
    if (!invoiceModal) return;
    try {
      await businessesService.invoiceCharge(invoiceModal.chargeId, invoiceNumber || undefined);
      toast.success('Cargo marcado como facturado');
      setInvoiceModal(null);
      setInvoiceNumber('');
      loadCharges(page);
    } catch (error) {
      toast.error('Error al facturar');
    }
  };

  const handlePay = async (chargeId: string) => {
    try {
      await businessesService.payCharge(chargeId);
      toast.success('Cargo marcado como pagado');
      loadCharges(page);
    } catch (error) {
      toast.error('Error al marcar como pagado');
    }
  };

  const columns = [
    {
      key: 'business',
      header: 'Comercio',
      render: (c: BusinessCharge) => (
        <span className="font-medium text-gray-900">{c.business?.name || '-'}</span>
      ),
    },
    {
      key: 'tracking',
      header: 'Envío',
      render: (c: BusinessCharge) => (
        <span className="text-sm font-mono text-gray-600">{c.delivery?.tracking_number || '-'}</span>
      ),
    },
    {
      key: 'dropoff',
      header: 'Destino',
      render: (c: BusinessCharge) => (
        <p className="text-sm text-gray-600 truncate max-w-[180px]">{c.delivery?.dropoff_address || '-'}</p>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (c: BusinessCharge) => (
        <div>
          <span className="font-semibold text-gray-900">${Number(c.amount).toLocaleString('es-AR')}</span>
          <p className="text-xs text-gray-400">
            Plataforma: ${Number(c.platform_fee).toLocaleString('es-AR')} / Cadete: ${Number(c.driver_amount).toLocaleString('es-AR')}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (c: BusinessCharge) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
          {statusLabel[c.status]}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (c: BusinessCharge) => (
        <span className="text-sm text-gray-500">
          {new Date(c.created_at).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (c: BusinessCharge) => (
        <div className="flex gap-2">
          {c.status === 'pending' && (
            <button
              onClick={() => setInvoiceModal({ chargeId: c.id, businessName: c.business?.name || '' })}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Marcar como facturado"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {(c.status === 'pending' || c.status === 'invoiced') && (
            <button
              onClick={() => handlePay(c.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Marcar como pagado"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout title="Facturación Comercios">
      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Facturación Comercios</h1>
          <p className="text-gray-500 mt-1">Cargos por envíos de comercios</p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
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
                <p className="text-sm text-gray-500">Pendiente</p>
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
                <p className="text-sm text-gray-500">Facturado</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">${totals.invoiced.toLocaleString('es-AR')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
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

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <select
            value={filters.business_id || ''}
            onChange={(e) => setFilters({ ...filters, business_id: e.target.value || undefined })}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Todos los comercios</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as any })}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="invoiced">Facturados</option>
            <option value="paid">Pagados</option>
          </select>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={charges}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={loadCharges}
          emptyMessage="No hay cargos registrados"
        />
      </div>

      {/* Modal Facturar */}
      {invoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Facturar cargo</h3>
            <p className="text-sm text-gray-500 mb-4">
              Comercio: <strong>{invoiceModal.businessName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nro. de factura (opcional)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ej: A-0001-00012345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setInvoiceModal(null); setInvoiceNumber(''); }}
                className="flex-1 py-3 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvoice}
                className="flex-1 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Facturar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FacturacionComerciosPage;
