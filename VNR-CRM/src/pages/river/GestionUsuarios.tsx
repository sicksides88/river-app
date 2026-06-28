import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { riverUsersService, RiverUserProfile, PatrolVessel } from '../../services/riverUsers.service';
import type { NavigatorVessel } from '../../services/auxilioAdmin.service';
import { VesselTypePicker } from '../../components/common';
import { getVesselTypeLabel, VesselTypeId } from '../../constants/vesselTypes';
import { Loader2, Pencil, Plus, Search, Trash2, Download, X } from 'lucide-react';

type TabId = 'navegantes' | 'patrones';

const driverStatusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'pending_documents', label: 'Documentos pendientes' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'suspended', label: 'Suspendido' },
];

const emptyForm = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  telefono_numero: '',
  direccion: '',
  driver_status: 'active',
  insurance_company: '',
  policy_number: '',
};

const GestionUsuarios: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('navegantes');
  const [users, setUsers] = useState<RiverUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RiverUserProfile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [vessels, setVessels] = useState<NavigatorVessel[]>([]);
  const [vesselForm, setVesselForm] = useState({ name: '', registration: '', type: 'Motor' as VesselTypeId });
  const [patrolVessels, setPatrolVessels] = useState<PatrolVessel[]>([]);
  const [patrolVesselForm, setPatrolVesselForm] = useState({
    name: '',
    plate_number: '',
    type: 'Motor' as VesselTypeId,
  });
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const { isSuperAdmin, canWrite } = useAuth();
  const isFullAdmin = isSuperAdmin;

  const role = activeTab === 'navegantes' ? 'user' : 'driver';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await riverUsersService.list({
        page,
        limit: 10,
        search: search || undefined,
        role,
      });
      setUsers(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setVessels([]);
    setVesselForm({ name: '', registration: '', type: 'Motor' });
    setModalOpen(true);
  };

  const openEdit = async (user: RiverUserProfile) => {
    setEditing(user);
    setForm({
      email: user.email,
      password: '',
      nombre: user.nombre,
      apellido: user.apellido,
      telefono_numero: user.telefono_numero || '',
      direccion: user.direccion || '',
      driver_status: user.driver_status || 'active',
      insurance_company: user.insurance_company || '',
      policy_number: user.policy_number || '',
    });
    setModalOpen(true);

    if (activeTab === 'navegantes') {
      try {
        const res = await riverUsersService.listVessels(user.id);
        setVessels(res.vessels || []);
      } catch {
        setVessels([]);
      }
      setPatrolVessels([]);
    } else {
      setVessels([]);
      try {
        const res = await riverUsersService.listPatrolVessels({ driverId: user.id });
        setPatrolVessels(res.vessels || []);
      } catch {
        setPatrolVessels([]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await riverUsersService.update(editing.id, {
          nombre: form.nombre,
          apellido: form.apellido,
          telefono_numero: form.telefono_numero,
          direccion: form.direccion,
          ...(activeTab === 'patrones' ? { driver_status: form.driver_status } : {}),
          ...(activeTab === 'navegantes'
            ? {
                insurance_company: form.insurance_company || null,
                policy_number: form.policy_number || null,
              }
            : {}),
        });
        toast.success('Usuario actualizado');
      } else {
        if (!form.password || form.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setSaving(false);
          return;
        }
        await riverUsersService.create({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          apellido: form.apellido,
          telefono_numero: form.telefono_numero,
          direccion: form.direccion,
          role,
          ...(activeTab === 'patrones' ? { driver_status: form.driver_status } : {}),
          ...(activeTab === 'navegantes'
            ? {
                insurance_company: form.insurance_company,
                policy_number: form.policy_number,
              }
            : {}),
        });
        toast.success(activeTab === 'navegantes' ? 'Navegante creado' : 'Patrón creado');
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: RiverUserProfile) => {
    if (!window.confirm(`¿Eliminar a ${user.nombre} ${user.apellido}?`)) return;
    try {
      await riverUsersService.remove(user.id);
      toast.success('Usuario eliminado');
      load();
    } catch {
      toast.error('No se pudo eliminar el usuario');
    }
  };

  const handleAddVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await riverUsersService.createVessel(editing.id, vesselForm);
      toast.success('Embarcación agregada');
      setVesselForm({ name: '', registration: '', type: 'Motor' });
      const res = await riverUsersService.listVessels(editing.id);
      setVessels(res.vessels || []);
    } catch {
      toast.error('Error al crear embarcación');
    }
  };

  const handleDeleteVessel = async (vesselId: string) => {
    if (!editing || !window.confirm('¿Eliminar esta embarcación?')) return;
    try {
      await riverUsersService.deleteVessel(vesselId);
      toast.success('Embarcación eliminada');
      const res = await riverUsersService.listVessels(editing.id);
      setVessels(res.vessels || []);
    } catch {
      toast.error('Error al eliminar embarcación');
    }
  };

  const handleAddPatrolVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await riverUsersService.createPatrolVessel(editing.id, {
        brand: patrolVesselForm.name,
        name: patrolVesselForm.name,
        type: patrolVesselForm.type,
        plate_number: patrolVesselForm.plate_number || patrolVesselForm.name,
      });
      toast.success('Embarcación de auxilio agregada');
      setPatrolVesselForm({ name: '', plate_number: '', type: 'Motor' });
      const res = await riverUsersService.listPatrolVessels({ driverId: editing.id });
      setPatrolVessels(res.vessels || []);
    } catch {
      toast.error('Error al crear embarcación de auxilio');
    }
  };

  const handleDeletePatrolVessel = async (vesselId: string) => {
    if (!editing || !window.confirm('¿Eliminar esta embarcación de la flota?')) return;
    try {
      await riverUsersService.deletePatrolVessel(vesselId);
      toast.success('Embarcación eliminada');
      const res = await riverUsersService.listPatrolVessels({ driverId: editing.id });
      setPatrolVessels(res.vessels || []);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await riverUsersService.downloadUsersExcel({
        role,
        search: search || undefined,
      });
      toast.success('Excel descargado');
    } catch {
      toast.error('No se pudo exportar la tabla');
    } finally {
      setExporting(false);
    }
  };

  const statusLabel = (status?: string | null) =>
    driverStatusOptions.find((o) => o.value === status)?.label || status || '—';

  return (
    <Layout title="Gestión de usuarios">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios River Service</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar Excel
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'navegantes' ? 'Nuevo navegante' : 'Nuevo patrón'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(
          [
            { id: 'navegantes' as TabId, label: 'Navegantes (Solicitantes)' },
            { id: 'patrones' as TabId, label: 'Patrones' },
          ] as const
        ).map((tab) => (
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

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
          placeholder="Buscar por nombre, apellido o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                {activeTab === 'patrones' && (
                  <th className="px-4 py-3 text-left">Estado</th>
                )}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'patrones' ? 5 : 4} className="px-4 py-10 text-center text-gray-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.telefono_numero || '—'}</td>
                    {activeTab === 'patrones' && (
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {statusLabel(u.driver_status)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isFullAdmin && canWrite && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 px-4 py-3 border-t">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editing
                  ? `Editar ${activeTab === 'navegantes' ? 'navegante' : 'patrón'}`
                  : `Nuevo ${activeTab === 'navegantes' ? 'navegante' : 'patrón'}`}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  />
                </div>
              </div>

              {!editing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña inicial</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    disabled
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                    value={form.email}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.telefono_numero}
                  onChange={(e) => setForm({ ...form, telefono_numero: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>

              {activeTab === 'patrones' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado del patrón</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.driver_status}
                    onChange={(e) => setForm({ ...form, driver_status: e.target.value })}
                  >
                    {driverStatusOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'navegantes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compañía de seguros</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.insurance_company}
                      onChange={(e) => setForm({ ...form, insurance_company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº de póliza</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.policy_number}
                      onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                    />
                  </div>

                  {editing && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium text-gray-900 mb-3">Embarcaciones</h3>
                      {vessels.length === 0 ? (
                        <p className="text-sm text-gray-400 mb-3">Sin embarcaciones registradas</p>
                      ) : (
                        <ul className="space-y-2 mb-4">
                          {vessels.map((v) => (
                            <li
                              key={v.id}
                              className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                            >
                              <span>
                                {v.name}
                                {v.type ? ` · ${getVesselTypeLabel(v.type)}` : ''}
                                {v.registration ? ` · ${v.registration}` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteVessel(v.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="space-y-3 mb-4">
                        <input
                          placeholder="Nombre embarcación"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={vesselForm.name}
                          onChange={(e) => setVesselForm({ ...vesselForm, name: e.target.value })}
                        />
                        <input
                          placeholder="Matrícula"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={vesselForm.registration}
                          onChange={(e) => setVesselForm({ ...vesselForm, registration: e.target.value })}
                        />
                        <VesselTypePicker
                          value={vesselForm.type}
                          onChange={(type) => setVesselForm({ ...vesselForm, type })}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVessel}
                        disabled={!vesselForm.name.trim()}
                        className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-40"
                      >
                        + Agregar embarcación
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'patrones' && editing && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Embarcaciones de auxilio</h3>
                  {patrolVessels.length === 0 ? (
                    <p className="text-sm text-gray-400 mb-3">Sin embarcaciones de flota</p>
                  ) : (
                    <ul className="space-y-2 mb-4">
                      {patrolVessels.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span>
                            {[v.brand, getVesselTypeLabel(v.specs?.hull_type || v.model), v.plate_number]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => handleDeletePatrolVessel(v.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {canWrite && (
                    <>
                      <div className="space-y-3">
                        <input
                          placeholder="Nombre de la unidad"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={patrolVesselForm.name}
                          onChange={(e) => setPatrolVesselForm({ ...patrolVesselForm, name: e.target.value })}
                        />
                        <input
                          placeholder="Matrícula"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={patrolVesselForm.plate_number}
                          onChange={(e) =>
                            setPatrolVesselForm({ ...patrolVesselForm, plate_number: e.target.value })
                          }
                        />
                        <VesselTypePicker
                          value={patrolVesselForm.type}
                          onChange={(type) => setPatrolVesselForm({ ...patrolVesselForm, type })}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPatrolVessel}
                        disabled={!patrolVesselForm.name.trim()}
                        className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-40"
                      >
                        + Agregar embarcación de auxilio
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-gray-700"
                >
                  Cancelar
                </button>
                {canWrite && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GestionUsuarios;
