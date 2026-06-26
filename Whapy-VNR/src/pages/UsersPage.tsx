import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable, StatusBadge } from '../components/common';
import { profilesService } from '../services';
import type { Profile, ProfileFilters, PaginatedResponse, UserRole } from '../types/database';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<Profile>>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProfileFilters>({});
  const [search, setSearch] = useState('');

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const result = await profilesService.getAll(page, 10, {
        ...filters,
        search: search || undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await profilesService.updateRole(userId, newRole);
      toast.success('Rol actualizado correctamente');
      loadUsers(data.page);
    } catch (error) {
      console.error('Error actualizando rol:', error);
      toast.error('Error al actualizar el rol');
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (user: Profile) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
            <span className="text-primary-600 font-medium">
              {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.nombre} {user.apellido}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telefono_numero',
      header: 'Teléfono',
      render: (user: Profile) => (
        <span className="text-gray-600">
          {user.telefono_codigo_pais} {user.telefono_numero}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user: Profile) => (
        user.role === 'admin' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Administrador
          </span>
        ) : (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
            className={`px-2 py-1 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black cursor-pointer ${
              user.role === 'driver'
                ? 'bg-blue-50 text-blue-800'
                : 'bg-gray-50 text-gray-800'
            }`}
          >
            <option value="user">Usuario</option>
            <option value="driver">Conductor</option>
          </select>
        )
      ),
    },
    {
      key: 'driver_status',
      header: 'Estado Conductor',
      render: (user: Profile) => (
        user.role === 'driver' && user.driver_status ? (
          <StatusBadge status={user.driver_status} size="sm" />
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'is_verified',
      header: 'Verificado',
      render: (user: Profile) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {user.is_verified ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      render: (user: Profile) => (
        <span className="text-gray-600">
          {new Date(user.created_at).toLocaleDateString('es-AR')}
        </span>
      ),
    },
  ];

  return (
    <Layout title="Usuarios">
      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex gap-3">
            <select
              value={filters.role || ''}
              onChange={(e) => setFilters({ ...filters, role: e.target.value as Profile['role'] || undefined })}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Todos los roles</option>
              <option value="user">Usuarios</option>
              <option value="driver">Conductores</option>
              <option value="admin">Administradores</option>
            </select>

            <select
              value={filters.driver_status || ''}
              onChange={(e) => setFilters({ ...filters, driver_status: e.target.value as Profile['driver_status'] || undefined })}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Estado conductor</option>
              <option value="pending_documents">Pendiente docs</option>
              <option value="pending_review">Pendiente revisión</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>

            <button
              type="button"
              onClick={() => loadUsers(1)}
              className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={data.data}
          loading={loading}
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={loadUsers}
          emptyMessage="No se encontraron usuarios"
        />
      </div>
    </Layout>
  );
};

export default UsersPage;
