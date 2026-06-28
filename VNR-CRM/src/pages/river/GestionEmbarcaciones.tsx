import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { SearchSelect, SearchSelectOption } from '../../components/common';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { auxilioAdminService } from '../../services/auxilioAdmin.service';
import { riverUsersService, PatrolVessel } from '../../services/riverUsers.service';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const GestionEmbarcaciones: React.FC = () => {
  const [vessels, setVessels] = useState<PatrolVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [patronId, setPatronId] = useState('');
  const [patronLabel, setPatronLabel] = useState('');
  const [form, setForm] = useState({ name: '', plate_number: '', capacity: '6' });
  const toast = useToast();
  const { canWrite } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await riverUsersService.listPatrolVessels({
        search: search || undefined,
        driverId: patronId || undefined,
      });
      setVessels(res.vessels || []);
    } catch {
      toast.error('Error al cargar flota');
    } finally {
      setLoading(false);
    }
  }, [search, patronId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const searchPatrons = useCallback(
    (query: string) => auxilioAdminService.searchPatronsAsOptions(query),
    []
  );

  const handlePatronFilter = (id: string, option: SearchSelectOption | null) => {
    setPatronId(id);
    setPatronLabel(option?.label || '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patronId) {
      toast.error('Seleccioná el patrón dueño de la embarcación');
      return;
    }
    try {
      await riverUsersService.createPatrolVessel(patronId, {
        name: form.name,
        plate_number: form.plate_number || form.name,
        capacity: Number(form.capacity) || 6,
      });
      toast.success('Embarcación de auxilio registrada');
      setForm({ name: '', plate_number: '', capacity: '6' });
      load();
    } catch {
      toast.error('Error al crear embarcación');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta embarcación de la flota?')) return;
    try {
      await riverUsersService.deletePatrolVessel(id);
      toast.success('Eliminada');
      load();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const vesselLabel = (v: PatrolVessel) =>
    [v.brand, v.model, v.plate_number].filter(Boolean).join(' · ') || v.id.slice(0, 8);

  return (
    <Layout title="Flota de auxilio">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Embarcaciones de auxilio</h1>
      <p className="text-sm text-gray-500 mb-6">Flota operativa de patrones (Fase 3)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="Buscar por nombre o matrícula…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SearchSelect
          label="Filtrar por patrón"
          placeholder="Todos los patrones"
          value={patronId}
          selectedLabel={patronLabel}
          onChange={handlePatronFilter}
          onSearch={searchPatrons}
          minSearchLength={0}
          allowClear
        />
      </div>

      {canWrite && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <SearchSelect
            label="Patrón"
            placeholder="Seleccionar patrón…"
            value={patronId}
            selectedLabel={patronLabel}
            onChange={handlePatronFilter}
            onSearch={searchPatrons}
            minSearchLength={0}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / modelo</label>
            <input
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.plate_number}
              onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Embarcación</th>
                <th className="px-4 py-3 text-left">Patrón</th>
                <th className="px-4 py-3 text-left">Capacidad</th>
                <th className="px-4 py-3 text-left">Estado</th>
                {canWrite && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {vessels.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="px-4 py-10 text-center text-gray-400">
                    Sin embarcaciones en la flota
                  </td>
                </tr>
              ) : (
                vessels.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{vesselLabel(v)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.driver ? `${v.driver.nombre} ${v.driver.apellido}` : '—'}
                    </td>
                    <td className="px-4 py-3">{v.capacity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          v.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.is_active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(v.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default GestionEmbarcaciones;
