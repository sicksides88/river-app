import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable } from '../components/common';
import { driversService, profilesService, auditoriaService } from '../services';
import { useAuth } from '../context/AuthContext';
import type { DriverDocument, DriverVehicle, Profile } from '../types/database';
import { FileText, CheckCircle, XCircle, Eye, Download, User, X, Car, Phone, Mail, Calendar, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const documentTypeLabels: Record<string, string> = {
  // Documentos de identidad
  dni_front: 'DNI Frente',
  dni_back: 'DNI Dorso',
  selfie_verification: 'Selfie de Verificación',
  // Licencia de conducir
  license_front: 'Licencia Frente',
  license_back: 'Licencia Dorso',
  // Documentos del vehículo
  vehicle_registration_front: 'Cédula Verde Frente',
  vehicle_registration_back: 'Cédula Verde Dorso',
  vehicle_photo: 'Foto del Vehículo',
  vehicle_insurance: 'Seguro del Vehículo',
  // Seguros y otros
  insurance: 'Seguro',
  vtv: 'VTV',
  // Nombres anteriores (por compatibilidad)
  dni_frente: 'DNI Frente',
  dni_dorso: 'DNI Dorso',
  licencia_frente: 'Licencia Frente',
  licencia_dorso: 'Licencia Dorso',
  cedula_verde: 'Cédula Verde',
  seguro: 'Seguro',
};

const documentTypeStyles: Record<string, { bg: string; text: string; border: string }> = {
  // Documentos de identidad - Azul
  dni_front: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dni_back: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dni_frente: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dni_dorso: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  selfie_verification: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  // Licencia - Púrpura
  license_front: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  license_back: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  licencia_frente: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  licencia_dorso: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  // Vehículo - Verde
  vehicle_registration_front: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  vehicle_registration_back: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  vehicle_photo: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  vehicle_insurance: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  cedula_verde: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  // Seguros y otros - Naranja/Cyan
  insurance: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  seguro: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  vtv: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

const getDocumentTypeBadge = (documentType: string) => {
  const style = documentTypeStyles[documentType] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  const label = documentTypeLabels[documentType] || documentType;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {label}
    </span>
  );
};

// Convierte signed URLs a URLs públicas de Supabase Storage
const getPublicUrl = (url: string | null): string => {
  if (!url) return '';
  // Si es una signed URL, convertirla a pública
  if (url.includes('/object/sign/')) {
    // Remover el token y cambiar /sign/ por /public/
    const publicUrl = url.replace('/object/sign/', '/object/public/').split('?')[0];
    return publicUrl;
  }
  return url;
};

const KYCPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingDrivers, setPendingDrivers] = useState<Profile[]>([]);
  const [pendingDocs, setPendingDocs] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'drivers' | 'documents'>('drivers');
  const [selectedDriver, setSelectedDriver] = useState<Profile | null>(null);
  const [driverDocs, setDriverDocs] = useState<DriverDocument[]>([]);
  const [driverVehicles, setDriverVehicles] = useState<DriverVehicle[]>([]);
  const [loadingDriverDocs, setLoadingDriverDocs] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [drivers, docs] = await Promise.all([
        profilesService.getPendingDrivers(),
        driversService.getPendingDocuments(),
      ]);
      setPendingDrivers(drivers);
      setPendingDocs(docs);
    } catch (error) {
      console.error('Error cargando KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewDriver = async (driver: Profile) => {
    setSelectedDriver(driver);
    setLoadingDriverDocs(true);
    try {
      const [docs, vehicles] = await Promise.all([
        driversService.getDriverDocuments(driver.id),
        driversService.getDriverVehicles(driver.id),
      ]);
      setDriverDocs(docs);
      setDriverVehicles(vehicles);
    } catch (error) {
      console.error('Error cargando datos del conductor:', error);
      setDriverDocs([]);
      setDriverVehicles([]);
    } finally {
      setLoadingDriverDocs(false);
    }
  };

  const handleCloseDriverModal = () => {
    setSelectedDriver(null);
    setDriverDocs([]);
    setDriverVehicles([]);
  };

  const handleApproveDriver = async (id: string) => {
    if (!user) return;
    const driver = pendingDrivers.find(d => d.id === id);
    if (window.confirm('¿Aprobar este conductor?')) {
      try {
        await profilesService.approveDriver(id);
        // Registrar en auditoría
        await auditoriaService.log({
          userId: user.id,
          actionType: 'driver_approved',
          entityType: 'profile',
          entityId: id,
          description: `Conductor aprobado: ${driver?.nombre} ${driver?.apellido} (${driver?.email})`,
        });
        toast.success('Conductor aprobado correctamente');
        loadData();
      } catch (error) {
        console.error('Error:', error);
        toast.error(`Error al aprobar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const handleRejectDriver = async (id: string) => {
    if (!user) return;
    const driver = pendingDrivers.find(d => d.id === id);
    const reason = window.prompt('Razón del rechazo:');
    if (reason) {
      try {
        await profilesService.rejectDriver(id, reason);
        // Registrar en auditoría
        await auditoriaService.log({
          userId: user.id,
          actionType: 'driver_rejected',
          entityType: 'profile',
          entityId: id,
          description: `Conductor rechazado: ${driver?.nombre} ${driver?.apellido} (${driver?.email}). Razón: ${reason}`,
        });
        toast.success('Conductor rechazado');
        loadData();
      } catch (error) {
        console.error('Error:', error);
        toast.error(`Error al rechazar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const handleApproveDoc = async (id: string) => {
    if (!user) return;
    const doc = pendingDocs.find(d => d.id === id) || selectedDoc;
    try {
      await driversService.approveDocument(id, user.id);
      // Registrar en auditoría
      await auditoriaService.log({
        userId: user.id,
        actionType: 'document_approved',
        entityType: 'driver_document',
        entityId: id,
        description: `Documento aprobado: ${documentTypeLabels[doc?.document_type || ''] || doc?.document_type}`,
      });
      toast.success('Documento aprobado');
      loadData();
      setSelectedDoc(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aprobar documento');
    }
  };

  const handleRejectDoc = async (id: string) => {
    if (!user) return;
    const doc = pendingDocs.find(d => d.id === id) || selectedDoc;
    const reason = window.prompt('Razón del rechazo:');
    if (reason) {
      try {
        await driversService.rejectDocument(id, user.id, reason);
        // Registrar en auditoría
        await auditoriaService.log({
          userId: user.id,
          actionType: 'document_rejected',
          entityType: 'driver_document',
          entityId: id,
          description: `Documento rechazado: ${documentTypeLabels[doc?.document_type || ''] || doc?.document_type}. Razón: ${reason}`,
        });
        toast.success('Documento rechazado');
        loadData();
        setSelectedDoc(null);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al rechazar documento');
      }
    }
  };

  const driverColumns = [
    {
      key: 'nombre',
      header: 'Conductor',
      render: (driver: Profile) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{driver.nombre} {driver.apellido}</p>
            <p className="text-sm text-gray-500">{driver.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (driver: Profile) => (
        <span>{driver.telefono_codigo_pais} {driver.telefono_numero}</span>
      ),
    },
    {
      key: 'driver_type',
      header: 'Tipo',
      render: (driver: Profile) => (
        <span className="capitalize">{driver.driver_type || 'No especificado'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Solicitud',
      render: (driver: Profile) => (
        <span>{new Date(driver.created_at).toLocaleDateString('es-AR')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (driver: Profile) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewDriver(driver); }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Ver detalles"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleApproveDriver(driver.id); }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Aprobar"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRejectDriver(driver.id); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Rechazar"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  const docColumns = [
    {
      key: 'document_type',
      header: 'Tipo de Documento',
      render: (doc: DriverDocument) => getDocumentTypeBadge(doc.document_type),
    },
    {
      key: 'driver',
      header: 'Conductor',
      render: (doc: DriverDocument) => (
        <span>
          {(doc.driver as { nombre?: string; apellido?: string })?.nombre}{' '}
          {(doc.driver as { nombre?: string; apellido?: string })?.apellido}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Subido',
      render: (doc: DriverDocument) => (
        <span>{new Date(doc.created_at).toLocaleDateString('es-AR')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (doc: DriverDocument) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Ver"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleApproveDoc(doc.id); }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Aprobar"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRejectDoc(doc.id); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Rechazar"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Gestión KYC">
      <div className="p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión KYC</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-gray-900">{pendingDrivers.length}</p>
          <p className="text-gray-600">Conductores pendientes</p>
        </div>
        <div className="bg-cyan-50 rounded-2xl p-5">
          <p className="text-3xl font-bold text-gray-900">{pendingDocs.length}</p>
          <p className="text-gray-600">Documentos pendientes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'drivers'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Conductores ({pendingDrivers.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Documentos ({pendingDocs.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'drivers' ? (
        <DataTable
          columns={driverColumns}
          data={pendingDrivers}
          loading={loading}
          emptyMessage="No hay conductores pendientes de aprobación"
        />
      ) : (
        <DataTable
          columns={docColumns}
          data={pendingDocs}
          loading={loading}
          emptyMessage="No hay documentos pendientes de revisión"
        />
      )}

      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedDoc(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">Vista previa de documento</h3>
                {getDocumentTypeBadge(selectedDoc.document_type)}
              </div>
              <div className="mb-4 bg-gray-100 rounded-xl p-4">
                <img
                  src={getPublicUrl(selectedDoc.file_url)}
                  alt={selectedDoc.document_type}
                  className="max-h-96 mx-auto rounded-lg"
                />
              </div>
              <div className="flex justify-between">
                <a
                  href={getPublicUrl(selectedDoc.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </a>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveDoc(selectedDoc.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleRejectDoc(selectedDoc.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseDriverModal} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-xl font-semibold text-gray-900">Detalles del Conductor</h3>
                <button
                  onClick={handleCloseDriverModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Driver Info */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {selectedDriver.avatar ? (
                        <img src={selectedDriver.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {selectedDriver.nombre} {selectedDriver.apellido}
                      </h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {selectedDriver.email}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {selectedDriver.telefono_codigo_pais} {selectedDriver.telefono_numero}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Car className="w-4 h-4 mr-2" />
                          Tipo: <span className="capitalize ml-1">{selectedDriver.driver_type || 'No especificado'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Registrado: {new Date(selectedDriver.created_at).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Documentos Adjuntos</h4>

                  {loadingDriverDocs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Cargando documentos...</p>
                    </div>
                  ) : driverDocs.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No hay documentos adjuntos</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {driverDocs.map((doc) => (
                        <div key={doc.id} className="border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            {getDocumentTypeBadge(doc.document_type)}
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {doc.status === 'approved' ? 'Aprobado' :
                               doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </span>
                          </div>

                          {doc.file_url && (
                            <div className="mb-3">
                              <img
                                src={getPublicUrl(doc.file_url)}
                                alt={doc.document_type}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => { setSelectedDoc(doc); }}
                              />
                            </div>
                          )}

                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Subido: {new Date(doc.created_at).toLocaleDateString('es-AR')}</span>
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

                {/* Vehicles Section */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Vehículos
                  </h4>

                  {loadingDriverDocs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Cargando vehículos...</p>
                    </div>
                  ) : driverVehicles.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No hay vehículos registrados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {driverVehicles.map((vehicle) => (
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
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => window.open(getPublicUrl(vehicle.photo_url), '_blank')}
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

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => { handleRejectDriver(selectedDriver.id); handleCloseDriverModal(); }}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => { handleApproveDriver(selectedDriver.id); handleCloseDriverModal(); }}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                  >
                    Aprobar Conductor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default KYCPage;
