import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { useToast } from '../../context/ToastContext';
import { riverReportsService, AuxilioReportRow } from '../../services/riverReports.service';
import { Download, Loader2 } from 'lucide-react';

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'accepted', label: 'Asignado' },
  { value: 'in_progress', label: 'En servicio' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const InformesRiver: React.FC = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState<AuxilioReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await riverReportsService.listAuxilios({
        from: from || undefined,
        to: to || undefined,
        status,
        limit: 500,
      });
      setRows(res.auxilios || []);
    } catch {
      toast.error('Error al cargar informe');
    } finally {
      setLoading(false);
    }
  }, [from, to, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await riverReportsService.downloadCsv({
        from: from || undefined,
        to: to || undefined,
        status,
        limit: 2000,
      });
      toast.success('Excel descargado');
    } catch {
      toast.error('No se pudo exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout title="Informes">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informes de auxilios</h1>
          <p className="text-sm text-gray-500">Exportación de auxilios a Excel</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            type="date"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            type="date"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={load}
            className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Emergencia</th>
                <th className="px-3 py-2 text-left">Navegante</th>
                <th className="px-3 py-2 text-left">Patrón</th>
                <th className="px-3 py-2 text-left">Embarcación</th>
                <th className="px-3 py-2 text-left">Dirección</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Sin registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleString('es-AR') : '—'}
                    </td>
                    <td className="px-3 py-2">{r.riverStatus || r.status}</td>
                    <td className="px-3 py-2">{r.emergencyType || '—'}</td>
                    <td className="px-3 py-2">{r.navegante || '—'}</td>
                    <td className="px-3 py-2">{r.patron || '—'}</td>
                    <td className="px-3 py-2">{r.embarcacion || '—'}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{r.direccion || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-gray-400 border-t">
            Mostrando {rows.length} registro(s). Máx. 500 en vista; exportación hasta 2000.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default InformesRiver;
