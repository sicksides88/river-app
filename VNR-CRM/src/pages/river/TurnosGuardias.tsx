import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { SearchSelect, SearchSelectOption } from '../../components/common';
import { auxilioAdminService } from '../../services/auxilioAdmin.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

type TabId = 'turnos' | 'bases';

const tabs: { id: TabId; label: string }[] = [
  { id: 'turnos', label: 'Turnos de guardia' },
  { id: 'bases', label: 'Bases operativas' },
];

const TurnosGuardias: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('turnos');
  const [shifts, setShifts] = useState<Record<string, unknown>[]>([]);
  const [bases, setBases] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [patronLabel, setPatronLabel] = useState('');
  const [form, setForm] = useState({
    driverId: '',
    baseId: '',
    startsAt: '',
    endsAt: '',
  });
  const [baseForm, setBaseForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const toast = useToast();
  const { canWrite } = useAuth();

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

  const searchPatrons = useCallback(
    (query: string) => auxilioAdminService.searchPatronsAsOptions(query),
    []
  );

  const handlePatronChange = (id: string, option: SearchSelectOption | null) => {
    setForm((prev) => ({ ...prev, driverId: id }));
    setPatronLabel(option?.label || '');
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.driverId) {
      toast.error('Seleccioná un patrón');
      return;
    }
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
      setPatronLabel('');
      load();
    } catch {
      toast.error('Error al crear turno');
    }
  };

  const handleCreateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auxilioAdminService.createBase({
        name: baseForm.name,
        address: baseForm.address || undefined,
        latitude: baseForm.latitude ? Number(baseForm.latitude) : undefined,
        longitude: baseForm.longitude ? Number(baseForm.longitude) : undefined,
      });
      toast.success('Base operativa creada');
      setBaseForm({ name: '', address: '', latitude: '', longitude: '' });
      load();
    } catch {
      toast.error('Error al crear base');
    }
  };

  return (
    <Layout title="Turnos de guardia">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Turnos y bases operativas</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'turnos' && (
        <div className="space-y-8">
          {canWrite && (
          <form
            onSubmit={handleCreateShift}
            className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h2 className="md:col-span-2 font-semibold text-gray-900">Nuevo turno de guardia</h2>

            <div className="md:col-span-2">
              <SearchSelect
                label="Patrón"
                placeholder="Seleccionar patrón…"
                searchPlaceholder="Buscar por nombre, email o teléfono"
                value={form.driverId}
                selectedLabel={patronLabel}
                onChange={handlePatronChange}
                onSearch={searchPatrons}
                minSearchLength={0}
                required
                emptyMessage="No hay patrones activos"
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

            <div />

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
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Turnos programados</h2>
              </div>
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
                  {shifts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No hay turnos registrados
                      </td>
                    </tr>
                  ) : (
                    shifts.map((s) => {
                      const driver = s.driver as { nombre?: string; apellido?: string } | undefined;
                      const base = s.base as { name?: string } | undefined;
                      return (
                        <tr key={String(s.id)}>
                          <td className="px-4 py-3">
                            {driver ? `${driver.nombre || ''} ${driver.apellido || ''}` : String(s.driver_id)}
                          </td>
                          <td className="px-4 py-3">{base?.name || '—'}</td>
                          <td className="px-4 py-3">
                            {s.starts_at ? new Date(String(s.starts_at)).toLocaleString('es-AR') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {s.ends_at ? new Date(String(s.ends_at)).toLocaleString('es-AR') : '—'}
                          </td>
                          <td className="px-4 py-3">{String(s.status)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bases' && (
        <div className="space-y-8">
          {canWrite && (
          <form
            onSubmit={handleCreateBase}
            className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <h2 className="md:col-span-2 font-semibold text-gray-900">Nueva base operativa</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={baseForm.name}
                onChange={(e) => setBaseForm({ ...baseForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / referencia</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={baseForm.address}
                onChange={(e) => setBaseForm({ ...baseForm, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input
                type="number"
                step="any"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={baseForm.latitude}
                onChange={(e) => setBaseForm({ ...baseForm, latitude: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input
                type="number"
                step="any"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={baseForm.longitude}
                onChange={(e) => setBaseForm({ ...baseForm, longitude: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Crear base
              </button>
            </div>
          </form>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Bases registradas</h2>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Dirección</th>
                    <th className="px-4 py-3 text-left">Coordenadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bases.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        No hay bases registradas
                      </td>
                    </tr>
                  ) : (
                    bases.map((b) => (
                      <tr key={String(b.id)}>
                        <td className="px-4 py-3 font-medium">{String(b.name)}</td>
                        <td className="px-4 py-3">{String(b.address || '—')}</td>
                        <td className="px-4 py-3">
                          {b.latitude != null && b.longitude != null
                            ? `${b.latitude}, ${b.longitude}`
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default TurnosGuardias;
