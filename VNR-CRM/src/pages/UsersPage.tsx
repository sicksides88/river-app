import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable, StatusBadge } from '../components/common';
import { profilesService, driversService } from '../services';
import type { Profile, ProfileFilters, PaginatedResponse, DriverDocument, DriverVehicle } from '../types/database';
import { Search, Trash2, Eye, X, User, Mail, Phone, Calendar, Car, FileText, Download, Shield, Star, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

const documentTypeLabels: Record<string, string> = {
  dni_front: 'DNI Frente',
  dni_back: 'DNI Dorso',
  selfie_verification: 'Selfie de Verificación',
  license_front: 'Licencia Frente',
  license_back: 'Licencia Dorso',
  vehicle_registration_front: 'Cédula Verde Frente',
  vehicle_registration_back: 'Cédula Verde Dorso',
  vehicle_photo: 'Foto del Vehículo',
  vehicle_insurance: 'Seguro del Vehículo',
  insurance: 'Seguro',
  vtv: 'VTV',
  certificado_buena_conducta: 'Certificado de Buena Conducta',
  buena_conducta: 'Certificado de Buena Conducta',
  seguro_accidentes_personales: 'Seguro de Accidentes Personales',
  seguro_accidentes: 'Seguro de Accidentes Personales',
  dni_frente: 'DNI Frente',
  dni_dorso: 'DNI Dorso',
  licencia_frente: 'Licencia Frente',
  licencia_dorso: 'Licencia Dorso',
  cedula_verde: 'Cédula Verde',
  seguro: 'Seguro',
};

const documentTypeStyles: Record<string, { bg: string; text: string; border: string }> = {
  dni_front: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dni_back: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dni_frente: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dni_dorso: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  selfie_verification: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  license_front: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  license_back: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  licencia_frente: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  licencia_dorso: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  vehicle_registration_front: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  vehicle_registration_back: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  vehicle_photo: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  vehicle_insurance: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  cedula_verde: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  insurance: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  seguro: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  vtv: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  certificado_buena_conducta: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  buena_conducta: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  seguro_accidentes_personales: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  seguro_accidentes: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const getDocumentTypeBadge = (documentType: string) => {
  const style = documentTypeStyles[documentType] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  const label = documentTypeLabels[documentType] || documentType;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {label}
    </span>
  );
};

const getPublicUrl = (url: string | null): string => {
  if (!url) return '';
  if (url.includes('/object/sign/')) {
    return url.replace('/object/sign/', '/object/public/').split('?')[0];
  }
  return url;
};

const trustLevelLabels: Record<string, string> = {
  bronce: 'Bronce',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

const trustLevelColors: Record<string, string> = {
  bronce: 'bg-orange-100 text-orange-800',
  plata: 'bg-gray-100 text-gray-800',
  oro: 'bg-yellow-100 text-yellow-800',
  platino: 'bg-indigo-100 text-indigo-800',
};

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

  // Modal state
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userDocs, setUserDocs] = useState<DriverDocument[]>([]);
  const [userVehicles, setUserVehicles] = useState<DriverVehicle[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DriverDocument | null>(null);

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

  const handleDeleteUser = async (user: Profile) => {
    if (user.role === 'admin') {
      toast.error('No se puede eliminar un administrador');
      return;
    }
    if (!window.confirm(`¿Estás seguro de que querés eliminar a ${user.nombre} ${user.apellido}?`)) return;
    try {
      await profilesService.delete(user.id);
      toast.success('Usuario eliminado correctamente');
      loadUsers(data.page);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast.error('Error al eliminar el usuario');
    }
  };

  const handleMakeAdmin = async (user: Profile) => {
    if (!window.confirm(`¿Estás seguro de que querés hacer administrador a ${user.nombre} ${user.apellido}?`)) return;
    try {
      await profilesService.update(user.id, { role: 'admin' });
      toast.success(`${user.nombre} ${user.apellido} ahora es administrador`);
      loadUsers(data.page);
    } catch (error) {
      console.error('Error asignando rol admin:', error);
      toast.error('Error al asignar rol de administrador');
    }
  };

  const handleRemoveAdmin = async (user: Profile) => {
    const wasDriver = !!user.driver_status;
    const newRole = wasDriver ? 'driver' : 'user';
    const roleLabel = wasDriver ? 'conductor' : 'usuario';
    if (!window.confirm(`¿Quitar rol de administrador a ${user.nombre} ${user.apellido}? Volverá a ser ${roleLabel}.`)) return;
    try {
      await profilesService.update(user.id, { role: newRole });
      toast.success(`${user.nombre} ${user.apellido} ahora es ${roleLabel}`);
      loadUsers(data.page);
    } catch (error) {
      console.error('Error removiendo rol admin:', error);
      toast.error('Error al quitar rol de administrador');
    }
  };

  const handleViewDriver = async (user: Profile) => {
    setSelectedUser(user);
    setLoadingModal(true);
    try {
      const [docs, vehicles] = await Promise.all([
        driversService.getDriverDocuments(user.id),
        driversService.getDriverVehicles(user.id),
      ]);
      setUserDocs(docs.filter(d => d.status === 'approved'));
      setUserVehicles(vehicles);
    } catch (error) {
      console.error('Error cargando datos del conductor:', error);
      setUserDocs([]);
      setUserVehicles([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setUserDocs([]);
    setUserVehicles([]);
    setPreviewDoc(null);
  };

  const isActiveDriver = (user: Profile) =>
    user.role === 'driver' && user.driver_status === 'active';

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
      key: 'tipo',
      header: 'Tipo',
      render: (user: Profile) => (
        user.role === 'admin' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Admin
          </span>
        ) : user.role === 'driver' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Conductor
          </span>
        ) : user.role === 'business' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Comercio
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Usuario
          </span>
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
    {
      key: 'actions',
      header: 'Acciones',
      render: (user: Profile) => (
        <div className="flex gap-1">
          {isActiveDriver(user) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleViewDriver(user); }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalle"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {user.role === 'admin' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveAdmin(user); }}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Quitar rol de administrador"
            >
              <ShieldOff className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleMakeAdmin(user); }}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Hacer administrador"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar usuario"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
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
              <option value="business">Comercios</option>
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

      {/* Modal Detalle Conductor Activo */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                <h3 className="text-xl font-semibold text-gray-900">Detalle del Conductor</h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Info del usuario */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {selectedUser.nombre} {selectedUser.apellido}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trustLevelColors[selectedUser.trust_level] || 'bg-gray-100 text-gray-800'}`}>
                          <Star className="w-3 h-3 mr-1" />
                          {trustLevelLabels[selectedUser.trust_level] || selectedUser.trust_level}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center text-gray-600 text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedUser.email}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {selectedUser.telefono_codigo_pais} {selectedUser.telefono_numero}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Car className="w-4 h-4 mr-2 text-gray-400" />
                          Tipo: <span className="capitalize ml-1">{selectedUser.driver_type || 'No especificado'}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          Registrado: {new Date(selectedUser.created_at).toLocaleDateString('es-AR')}
                        </div>
                        {selectedUser.driver_approved_at && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <Shield className="w-4 h-4 mr-2 text-gray-400" />
                            Aprobado: {new Date(selectedUser.driver_approved_at).toLocaleDateString('es-AR')}
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 text-sm">
                          <Star className="w-4 h-4 mr-2 text-gray-400" />
                          Puntos de confianza: {selectedUser.trust_points}
                        </div>
                      </div>
                      {selectedUser.selected_services && selectedUser.selected_services.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {selectedUser.selected_services.map(service => (
                            <span key={service} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium capitalize">
                              {service.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {loadingModal ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando datos...</p>
                  </div>
                ) : (
                  <>
                    {/* Documentos aprobados */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Documentos Aprobados ({userDocs.length})
                      </h4>

                      {userDocs.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No hay documentos aprobados</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userDocs.map((doc) => (
                            <div key={doc.id} className="border rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                {getDocumentTypeBadge(doc.document_type)}
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                  Aprobado
                                </span>
                              </div>

                              {doc.file_url && (
                                <div className="mb-3">
                                  <img
                                    src={getPublicUrl(doc.file_url)}
                                    alt={doc.document_type}
                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                    onClick={() => setPreviewDoc(doc)}
                                  />
                                </div>
                              )}

                              <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Aprobado: {doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString('es-AR') : '-'}</span>
                                <a
                                  href={getPublicUrl(doc.file_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Descargar
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vehículos */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Car className="w-5 h-5 mr-2" />
                        Vehículos ({userVehicles.length})
                      </h4>

                      {userVehicles.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No hay vehículos registrados</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userVehicles.map((vehicle) => (
                            <div key={vehicle.id} className="border rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <Car className="w-5 h-5 text-gray-400 mr-2" />
                                  <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  vehicle.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {vehicle.is_verified ? 'Verificado' : 'Pendiente'}
                                </span>
                              </div>

                              {vehicle.photo_url && (
                                <div className="mb-3">
                                  <img
                                    src={getPublicUrl(vehicle.photo_url)}
                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                </div>
                              )}

                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Patente:</span> {vehicle.plate}</p>
                                <p><span className="font-medium">Año:</span> {vehicle.year}</p>
                                <p><span className="font-medium">Color:</span> {vehicle.color}</p>
                                <p><span className="font-medium">Tipo:</span> <span className="capitalize">{vehicle.vehicle_type}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview documento */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setPreviewDoc(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">Vista previa</h3>
                {getDocumentTypeBadge(previewDoc.document_type)}
              </div>
              <div className="mb-4 bg-gray-100 rounded-xl p-4">
                <img
                  src={getPublicUrl(previewDoc.file_url)}
                  alt={previewDoc.document_type}
                  className="max-h-96 mx-auto rounded-lg"
                />
              </div>
              <div className="flex justify-between">
                <a
                  href={getPublicUrl(previewDoc.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;
