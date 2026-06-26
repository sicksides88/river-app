import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { auxilioAdminService } from '../../services/auxilioAdmin.service';
import { useToast } from '../../context/ToastContext';
import { Loader2 } from 'lucide-react';

const TurnosGuardias: React.FC = () => {
  const [shifts, setShifts] = useState<Record<string, unknown>[]>([]);
  const [bases, setBases] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    driverId: '',
    baseId: '',
    startsAt: '',
    endsAt: '',
  });
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        auxilioAdminService.listShifts(),
        auxilioAdminService.listBases(),
      ]);
      setShifts(s.shifts || []);
      setBases(b.bases || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auxilioAdminService.createShift({
        driverId: form.driverId,
        baseId: form.baseId || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        status: 'scheduled',
      });
      toast.success('Turno creado');
      setForm({ driverId: '', baseId: '', startsAt: '', endsAt: '' });
      load();
    } catch {
      toast.error('Error al crear turno');
    }
  };

  return (
    <Layout title="Turnos de guardia">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Turnos y bases operativas</h1>

      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID patrón (UUID)</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.driverId}
            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.baseId}
            onChange={(e) => setForm({ ...form, baseId: e.target.value })}
          >
            <option value="">Sin base</option>
            {bases.map((b) => (
              <option key={String(b.id)} value={String(b.id)}>
                {String(b.name)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            required
          />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
            Crear turno
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Patrón</th>
                <th className="px-4 py-3 text-left">Base</th>
                <th className="px-4 py-3 text-left">Inicio</th>
                <th className="px-4 py-3 text-left">Fin</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shifts.map((s) => {
                const driver = s.driver as { nombre?: string; apellido?: string } | undefined;
                const base = s.base as { name?: string } | undefined;
                return (
                  <tr key={String(s.id)}>
                    <td className="px-4 py-3">{driver ? `${driver.nombre || ''} ${driver.apellido || ''}` : String(s.driver_id)}</td>
                    <td className="px-4 py-3">{base?.name || '—'}</td>
                    <td className="px-4 py-3">{s.starts_at ? new Date(String(s.starts_at)).toLocaleString('es-AR') : '—'}</td>
                    <td className="px-4 py-3">{s.ends_at ? new Date(String(s.ends_at)).toLocaleString('es-AR') : '—'}</td>
                    <td className="px-4 py-3">{String(s.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default TurnosGuardias;
