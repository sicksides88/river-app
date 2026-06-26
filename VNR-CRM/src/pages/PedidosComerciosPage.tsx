import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable, StatusBadge } from '../components/common';
import { businessesService } from '../services';
import type { Business, BusinessDeliveryFilters, Delivery, PaginatedResponse, DeliveryStatus } from '../types/database';
import { UserPlus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AvailableDriver {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  avatar: string | null;
  lat: number | null;
  lng: number | null;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  arrived_pickup: 'En origen',
  picked_up: 'Recogido',
  in_transit: 'En camino',
  arrived_dropoff: 'En destino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PedidosComerciosPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<Delivery & { business?: Business }>>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BusinessDeliveryFilters>({});

  // Modal de asignación
  const [assignModal, setAssignModal] = useState<{ open: boolean; deliveryId: string | null }>({
    open: false,
    deliveryId: null,
  });
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Businesses para filtro
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const loadDeliveries = async (page = 1) => {
    setLoading(true);
    try {
      const result = await businessesService.getBusinessDeliveries(page, 10, filters);
      setData(result);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessesList = async () => {
    try {
      const result = await businessesService.getAll(1, 100);
      setBusinesses(result.data);
    } catch (error) {
      console.error('Error cargando comercios:', error);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [filters]);

  useEffect(() => {
    loadBusinessesList();
  }, []);

  const openAssignModal = async (deliveryId: string) => {
    setAssignModal({ open: true, deliveryId });
    setLoadingDrivers(true);
    try {
      const result = await businessesService.getAvailableDrivers();
      setDrivers(result);
    } catch (error) {
      console.error('Error cargando cadetes:', error);
      toast.error('Error al cargar cadetes disponibles');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssign = async (driverId: string) => {
    if (!assignModal.deliveryId) return;
    setAssigning(true);
    try {
      await businessesService.assignDriver(assignModal.deliveryId, driverId);
      toast.success('Cadete asignado correctamente');
      setAssignModal({ open: false, deliveryId: null });
      loadDeliveries(data.page);
    } catch (error) {
      console.error('Error asignando cadete:', error);
      toast.error('Error al asignar cadete');
    } finally {
      setAssigning(false);
    }
  };

  const columns = [
    {
      key: 'business',
      header: 'Comercio',
      render: (d: Delivery & { business?: Business }) => (
        <div>
          <p className="font-medium text-gray-900">{(d as any).business?.name || '-'}</p>
          <p className="text-xs text-gray-500">{d.tracking_number}</p>
        </div>
      ),
    },
    {
      key: 'pickup_address',
      header: 'Origen',
      render: (d: Delivery) => (
        <div className="max-w-[200px]">
          <p className="text-sm text-gray-900 truncate">{d.pickup_address}</p>
          <p className="text-xs text-gray-500">{d.pickup_contact_name}</p>
        </div>
      ),
    },
    {
      key: 'dropoff_address',
      header: 'Destino',
      render: (d: Delivery) => (
        <div className="max-w-[200px]">
          <p className="text-sm text-gray-900 truncate">{d.dropoff_address}</p>
          <p className="text-xs text-gray-500">{d.dropoff_contact_name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (d: Delivery) => (
        <StatusBadge status={d.status} size="sm" />
      ),
    },
    {
      key: 'driver',
      header: 'Cadete',
      render: (d: Delivery) => (
        d.driver ? (
          <span className="text-sm text-gray-900">
            {d.driver.nombre} {d.driver.apellido}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Sin asignar</span>
        )
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      render: (d: Delivery) => (
        <span className="text-gray-600 text-sm">
          {new Date(d.created_at).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (d: Delivery) => (
        d.status === 'pending' ? (
          <button
            onClick={() => openAssignModal(d.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Asignar
          </button>
        ) : null
      ),
    },
  ];

  return (
    <Layout title="Pedidos Comercios">
      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pedidos de Comercios</h1>
          <p className="text-gray-500 mt-1">Solicitudes de envío de comercios registrados</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <select
            value={filters.business_id || ''}
            onChange={(e) => setFilters({ ...filters, business_id: e.target.value || undefined })}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Todos los comercios</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: (e.target.value as DeliveryStatus) || undefined })}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Hasta"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={data.data}
          loading={loading}
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={loadDeliveries}
          emptyMessage="No se encontraron pedidos de comercios"
        />
      </div>

      {/* Modal asignar cadete */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setAssignModal({ open: false, deliveryId: null })} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Asignar Cadete</h2>
                <button
                  onClick={() => setAssignModal({ open: false, deliveryId: null })}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDrivers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay cadetes disponibles en este momento</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {drivers.map(driver => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium text-sm">
                            {driver.nombre?.charAt(0)}{driver.apellido?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{driver.nombre} {driver.apellido}</p>
                          <p className="text-sm text-gray-500">{driver.telefono}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssign(driver.id)}
                        disabled={assigning}
                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {assigning ? 'Asignando...' : 'Asignar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PedidosComerciosPage;
