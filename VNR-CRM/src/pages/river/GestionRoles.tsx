import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { ExportExcelButton } from '../../components/common';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { riverUsersService, CrmStaffProfile } from '../../services/riverUsers.service';
import { Loader2, Plus, X } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Super Admin',
  operator: 'Operador',
  auditor: 'Auditor (solo lectura)',
};

const emptyForm = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  role: 'operator' as 'operator' | 'auditor',
};

const GestionRoles: React.FC = () => {
  const [staff, setStaff] = useState<CrmStaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await riverUsersService.listStaff();
      setStaff(res.staff || []);
    } catch {
      toast.error('Error al cargar personal CRM');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await riverUsersService.createStaff(form);
      toast.success('Usuario CRM creado');
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al crear';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <Layout title="Roles CRM">
        <p className="text-gray-500">Solo Super Admin puede gestionar roles del CRM.</p>
      </Layout>
    );
  }

  return (
    <Layout title="Roles CRM">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles del CRM</h1>
          <p className="text-sm text-gray-500">Super Admin, Operador y Auditor (Fase 3)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportExcelButton
            filename="roles-crm-river"
            headers={['nombre', 'apellido', 'email', 'rol', 'fecha_alta']}
            getRows={() =>
              staff.map((s) => [
                s.nombre,
                s.apellido,
                s.email,
                roleLabels[s.role] || s.role,
                s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR') : '',
              ])
            }
          />
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo operador / auditor
          </button>
        </div>
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
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {s.nombre} {s.apellido}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        s.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : s.role === 'auditor'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {roleLabels[s.role] || s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Nuevo usuario CRM</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Nombre"
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <input
                  required
                  placeholder="Apellido"
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </div>
              <input
                type="email"
                required
                placeholder="Email"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Contraseña inicial"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'operator' | 'auditor' })}
              >
                <option value="operator">Operador</option>
                <option value="auditor">Auditor (solo lectura)</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 border rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GestionRoles;
