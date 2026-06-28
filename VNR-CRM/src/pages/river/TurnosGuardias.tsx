import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { ExportExcelButton, SearchSelect, SearchSelectOption } from '../../components/common';
import {
  auxilioAdminService,
  PatrolBase,
  PatrolShift,
} from '../../services/auxilioAdmin.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Pencil, Trash2, X } from 'lucide-react';

type TabId = 'turnos' | 'bases';

const tabs: { id: TabId; label: string }[] = [
  { id: 'turnos', label: 'Turnos de guardia' },
  { id: 'bases', label: 'Bases operativas' },
];

const SHIFT_STATUSES = [
  { value: 'scheduled', label: 'Programado' },
  { value: 'active', label: 'Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
] as const;

function shiftStatusLabel(status: string) {
  return SHIFT_STATUSES.find((s) => s.value === status)?.label || status;
}

function shiftStatusClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-700';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

function patronName(driver?: PatrolShift['driver'] | null) {
  if (!driver) return '';
  return `${driver.nombre || ''} ${driver.apellido || ''}`.trim();
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyShiftForm = {
  driverId: '',
  baseId: '',
  startsAt: '',
  endsAt: '',
  status: 'scheduled' as PatrolShift['status'],
};

const emptyBaseForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
};

const TurnosGuardias: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('turnos');
  const [shifts, setShifts] = useState<PatrolShift[]>([]);
  const [bases, setBases] = useState<PatrolBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patronLabel, setPatronLabel] = useState('');
  const [form, setForm] = useState(emptyShiftForm);
  const [baseForm, setBaseForm] = useState(emptyBaseForm);

  const [editingShift, setEditingShift] = useState<PatrolShift | null>(null);
  const [editShiftForm, setEditShiftForm] = useState(emptyShiftForm);
  const [editPatronLabel, setEditPatronLabel] = useState('');

  const [editingBase, setEditingBase] = useState<PatrolBase | null>(null);
  const [editBaseForm, setEditBaseForm] = useState(emptyBaseForm);

  const toast = useToast();
  const { canWrite } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        auxilioAdminService.listShifts(),
        auxilioAdminService.listBases(),
      ]);
      setShifts(s.shifts || []);
      setBases(b.bases || []);
    } catch {
      toast.error('Error al cargar turnos y bases');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const searchPatrons = useCallback(
    (query: string) => auxilioAdminService.searchPatronsAsOptions(query),
    []
  );

  const handlePatronChange = (id: string, option: SearchSelectOption | null) => {
    setForm((prev) => ({ ...prev, driverId: id }));
    setPatronLabel(option?.label || '');
  };

  const handleEditPatronChange = (id: string, option: SearchSelectOption | null) => {
    setEditShiftForm((prev) => ({ ...prev, driverId: id }));
    setEditPatronLabel(option?.label || '');
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.driverId) {
      toast.error('Seleccioná un patrón');
      return;
    }
    setSaving(true);
    try {
      await auxilioAdminService.createShift({
        driverId: form.driverId,
        baseId: form.baseId || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        status: form.status,
      });
      toast.success('Turno creado');
      setForm(emptyShiftForm);
      setPatronLabel('');
      load();
    } catch {
      toast.error('Error al crear turno');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await auxilioAdminService.createBase({
        name: baseForm.name,
        address: baseForm.address || undefined,
        latitude: baseForm.latitude ? Number(baseForm.latitude) : undefined,
        longitude: baseForm.longitude ? Number(baseForm.longitude) : undefined,
      });
      toast.success('Base operativa creada');
      setBaseForm(emptyBaseForm);
      load();
    } catch {
      toast.error('Error al crear base');
    } finally {
      setSaving(false);
    }
  };

  const openEditShift = (shift: PatrolShift) => {
    setEditingShift(shift);
    setEditShiftForm({
      driverId: shift.driver_id,
      baseId: shift.base_id || '',
      startsAt: toDatetimeLocal(shift.starts_at),
      endsAt: toDatetimeLocal(shift.ends_at),
      status: shift.status,
    });
    setEditPatronLabel(patronName(shift.driver));
  };

  const closeEditShift = () => {
    setEditingShift(null);
    setEditShiftForm(emptyShiftForm);
    setEditPatronLabel('');
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    if (!editShiftForm.driverId) {
      toast.error('Seleccioná un patrón');
      return;
    }
    setSaving(true);
    try {
      await auxilioAdminService.updateShift(editingShift.id, {
        driverId: editShiftForm.driverId,
        baseId: editShiftForm.baseId || null,
        startsAt: new Date(editShiftForm.startsAt).toISOString(),
        endsAt: new Date(editShiftForm.endsAt).toISOString(),
        status: editShiftForm.status,
      });
      toast.success('Turno actualizado');
      closeEditShift();
      load();
    } catch {
      toast.error('Error al actualizar turno');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (shift: PatrolShift) => {
    const name = patronName(shift.driver) || 'este turno';
    if (!window.confirm(`¿Eliminar el turno de ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await auxilioAdminService.deleteShift(shift.id);
      toast.success('Turno eliminado');
      if (editingShift?.id === shift.id) closeEditShift();
      load();
    } catch {
      toast.error('No se pudo eliminar el turno');
    }
  };

  const openEditBase = (base: PatrolBase) => {
    setEditingBase(base);
    setEditBaseForm({
      name: base.name,
      address: base.address || '',
      latitude: base.latitude != null ? String(base.latitude) : '',
      longitude: base.longitude != null ? String(base.longitude) : '',
    });
  };

  const closeEditBase = () => {
    setEditingBase(null);
    setEditBaseForm(emptyBaseForm);
  };

  const handleUpdateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBase) return;
    setSaving(true);
    try {
      await auxilioAdminService.updateBase(editingBase.id, {
        name: editBaseForm.name,
        address: editBaseForm.address || undefined,
        latitude: editBaseForm.latitude ? Number(editBaseForm.latitude) : null,
        longitude: editBaseForm.longitude ? Number(editBaseForm.longitude) : null,
      });
      toast.success('Base actualizada');
      closeEditBase();
      load();
    } catch {
      toast.error('Error al actualizar base');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBase = async (base: PatrolBase) => {
    if (
      !window.confirm(
        `¿Eliminar la base "${base.name}"?\n\nLos turnos vinculados quedarán sin base asignada.`
      )
    ) {
      return;
    }
    try {
      await auxilioAdminService.deleteBase(base.id);
      toast.success('Base eliminada');
      if (editingBase?.id === base.id) closeEditBase();
      load();
    } catch {
      toast.error('No se pudo eliminar la base');
    }
  };

  return (
    <Layout title="Turnos de guardia">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Turnos y bases operativas</h1>
        <ExportExcelButton
          filename={activeTab === 'turnos' ? 'turnos-guardia-river' : 'bases-operativas-river'}
          headers={
            activeTab === 'turnos'
              ? ['patron', 'base', 'inicio', 'fin', 'estado']
              : ['nombre', 'direccion', 'latitud', 'longitud']
          }
          getRows={() => {
            if (activeTab === 'turnos') {
              return shifts.map((s) => [
                patronName(s.driver) || s.driver_id,
                s.base?.name || '—',
                s.starts_at ? new Date(s.starts_at).toLocaleString('es-AR') : '',
                s.ends_at ? new Date(s.ends_at).toLocaleString('es-AR') : '',
                shiftStatusLabel(s.status),
              ]);
            }
            return bases.map((b) => [
              b.name,
              b.address || '',
              b.latitude != null ? String(b.latitude) : '',
              b.longitude != null ? String(b.longitude) : '',
            ]);
          }}
        />
      </div>

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
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as PatrolShift['status'] })
                  }
                >
                  {SHIFT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
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
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Crear turno'}
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
                    {canWrite && <th className="px-4 py-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shifts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canWrite ? 6 : 5}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No hay turnos registrados
                      </td>
                    </tr>
                  ) : (
                    shifts.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{patronName(s.driver) || s.driver_id}</td>
                        <td className="px-4 py-3">{s.base?.name || '—'}</td>
                        <td className="px-4 py-3">
                          {s.starts_at ? new Date(s.starts_at).toLocaleString('es-AR') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {s.ends_at ? new Date(s.ends_at).toLocaleString('es-AR') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${shiftStatusClass(s.status)}`}
                          >
                            {shiftStatusLabel(s.status)}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditShift(s)}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteShift(s)}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección / referencia
                </label>
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
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Crear base'}
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
                    {canWrite && <th className="px-4 py-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canWrite ? 4 : 3}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No hay bases registradas
                      </td>
                    </tr>
                  ) : (
                    bases.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{b.name}</td>
                        <td className="px-4 py-3">{b.address || '—'}</td>
                        <td className="px-4 py-3">
                          {b.latitude != null && b.longitude != null
                            ? `${b.latitude}, ${b.longitude}`
                            : '—'}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditBase(b)}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBase(b)}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Editar turno de guardia</h2>
              <button
                type="button"
                onClick={closeEditShift}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateShift} className="p-6 space-y-4">
              <SearchSelect
                label="Patrón"
                placeholder="Seleccionar patrón…"
                searchPlaceholder="Buscar por nombre, email o teléfono"
                value={editShiftForm.driverId}
                selectedLabel={editPatronLabel}
                onChange={handleEditPatronChange}
                onSearch={searchPatrons}
                minSearchLength={0}
                required
                emptyMessage="No hay patrones activos"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editShiftForm.baseId}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, baseId: e.target.value })}
                >
                  <option value="">Sin base</option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editShiftForm.status}
                  onChange={(e) =>
                    setEditShiftForm({
                      ...editShiftForm,
                      status: e.target.value as PatrolShift['status'],
                    })
                  }
                >
                  {SHIFT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={editShiftForm.startsAt}
                    onChange={(e) =>
                      setEditShiftForm({ ...editShiftForm, startsAt: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={editShiftForm.endsAt}
                    onChange={(e) =>
                      setEditShiftForm({ ...editShiftForm, endsAt: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteShift(editingShift)}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Editar base operativa</h2>
              <button
                type="button"
                onClick={closeEditBase}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateBase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editBaseForm.name}
                  onChange={(e) => setEditBaseForm({ ...editBaseForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección / referencia
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editBaseForm.address}
                  onChange={(e) => setEditBaseForm({ ...editBaseForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={editBaseForm.latitude}
                    onChange={(e) =>
                      setEditBaseForm({ ...editBaseForm, latitude: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={editBaseForm.longitude}
                    onChange={(e) =>
                      setEditBaseForm({ ...editBaseForm, longitude: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBase(editingBase)}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TurnosGuardias;
