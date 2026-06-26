import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable } from '../components/common';
import { businessesService } from '../services';
import type { Business, BusinessFilters, PaginatedResponse } from '../types/database';
import { Search, Store, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ComerciosPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<Business>>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BusinessFilters>({});
  const [search, setSearch] = useState('');

  const loadBusinesses = async (page = 1) => {
    setLoading(true);
    try {
      const result = await businessesService.getAll(page, 10, {
        ...filters,
        search: search || undefined,
      });
      setData(result);
    } catch (error) {
      console.error('Error cargando comercios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBusinesses(1);
  };

  const handleToggleActive = async (business: Business) => {
    try {
      await businessesService.toggleActive(business.id, !business.is_active);
      toast.success(business.is_active ? 'Comercio desactivado' : 'Comercio activado');
      loadBusinesses(data.page);
    } catch (error) {
      console.error('Error actualizando comercio:', error);
      toast.error('Error al actualizar el comercio');
    }
  };

  const handleDelete = async (business: Business) => {
    if (!confirm(`¿Seguro que querés eliminar "${business.name}"? Se borrarán todos sus datos.`)) return;
    try {
      await businessesService.deleteBusiness(business.id);
      toast.success(`Comercio "${business.name}" eliminado`);
      loadBusinesses(1);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al eliminar el comercio';
      toast.error(msg);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Comercio',
      render: (biz: Business) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
            <Store className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{biz.name}</p>
            <p className="text-sm text-gray-500">{biz.address || 'Sin dirección'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (biz: Business) => (
        <span className="text-gray-600">{biz.phone || '-'}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (biz: Business) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          biz.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {biz.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      render: (biz: Business) => (
        <span className="text-gray-600">
          {new Date(biz.created_at).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (biz: Business) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToggleActive(biz)}
            className={`p-2 rounded-lg transition-colors ${
              biz.is_active
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={biz.is_active ? 'Desactivar' : 'Activar'}
          >
            {biz.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => handleDelete(biz)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar comercio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Comercios">
      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Comercios</h1>
          <p className="text-gray-500 mt-1">Comercios registrados en la plataforma</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o dirección..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex gap-3">
            <select
              value={filters.is_active === undefined ? '' : String(filters.is_active)}
              onChange={(e) => setFilters({
                ...filters,
                is_active: e.target.value === '' ? undefined : e.target.value === 'true',
              })}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <button
              type="button"
              onClick={() => loadBusinesses(1)}
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
          onPageChange={loadBusinesses}
          emptyMessage="No se encontraron comercios"
        />
      </div>
    </Layout>
  );
};

export default ComerciosPage;
