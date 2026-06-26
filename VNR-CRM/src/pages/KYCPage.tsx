import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DataTable } from '../components/common';
import { driversService, auditoriaService } from '../services';
import { useAuth } from '../context/AuthContext';
import type { DriverDocument } from '../types/database';
import { CheckCircle, XCircle, Eye, Download, Search, RefreshCw, Phone, ShieldCheck, X } from 'lucide-react';
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

const docLabel = (t: string) => documentTypeLabels[t] || t;

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobado' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' },
  };
  const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
};

// Convierte signed URLs a URLs públicas de Supabase Storage
const getPublicUrl = (url: string | null): string => {
  if (!url) return '';
  if (url.includes('/object/sign/')) {
    return url.replace('/object/sign/', '/object/public/').split('?')[0];
  }
  return url;
};

type DriverInfo = {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono_numero?: string;
  telefono_codigo_pais?: string;
  driver_status?: string;
  driver_type?: string;
  avatar?: string;
};

type DriverGroup = {
  id: string;
  driver: DriverInfo;
  docs: DriverDocument[];
  lastUpload: string;
};

const fullName = (d?: DriverInfo) => `${d?.nombre || ''} ${d?.apellido || ''}`.trim() || 'Sin nombre';
const phoneDigits = (d?: DriverInfo) => `${d?.telefono_codigo_pais || ''}${d?.telefono_numero || ''}`.replace(/\D/g, '');

const KYCPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingDocs, setPendingDocs] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');

  // Detalle del cadete
  const [selectedDriver, setSelectedDriver] = useState<DriverInfo | null>(null);
  const [driverDocs, setDriverDocs] = useState<DriverDocument[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const docs = await driversService.getPendingDocuments();
      setPendingDocs(docs);
    } catch (error) {
      console.error('Error cargando KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Agrupar documentos pendientes por conductor
  const groups: DriverGroup[] = Object.values(
    pendingDocs.reduce((acc: Record<string, DriverGroup>, doc) => {
      const driver = (doc.driver as DriverInfo) || { id: (doc as { driver_id: string }).driver_id };
      const key = driver.id;
      if (!acc[key]) acc[key] = { id: key, driver, docs: [], lastUpload: doc.created_at };
      acc[key].docs.push(doc);
      if (new Date(doc.created_at) > new Date(acc[key].lastUpload)) acc[key].lastUpload = doc.created_at;
      return acc;
    }, {})
  );

  const filteredGroups = groups.filter(g =>
    !searchName || fullName(g.driver).toLowerCase().includes(searchName.toLowerCase())
  );

  const openDriverDetail = async (driver: DriverInfo) => {
    setSelectedDriver(driver);
    setDetailLoading(true);
    try {
      const docs = await driversService.getDriverDocuments(driver.id);
      setDriverDocs(docs);
    } catch (e) {
      console.error(e);
      setDriverDocs([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (selectedDriver) {
      const docs = await driversService.getDriverDocuments(selectedDriver.id);
      setDriverDocs(docs);
    }
    loadData();
  };

  const handleApproveDoc = async (doc: DriverDocument) => {
    if (!user) { toast.error('No hay sesión activa.'); return; }
    try {
      await driversService.approveDocument(doc.id, user.id);
      await auditoriaService.log({
        userId: user.id, actionType: 'document_approved', entityType: 'driver_document',
        entityId: doc.id, description: `Documento aprobado: ${docLabel(doc.document_type)}`,
      }).catch(() => {});
      toast.success('Documento aprobado');
      await refreshDetail();
    } catch (e) {
      toast.error(`Error al aprobar: ${e instanceof Error ? e.message : ''}`);
    }
  };

  const handleRejectDoc = async (doc: DriverDocument, resubmission = false) => {
    if (!user) return;
    const def = resubmission
      ? 'Necesitamos que reenvíes este documento (no se lee bien / está vencido / no corresponde).'
      : '';
    const reason = window.prompt(
      resubmission ? 'Mensaje para el cadete (qué tiene que reenviar):' : 'Razón del rechazo:',
      def
    );
    if (!reason) return;
    try {
      await driversService.rejectDocument(doc.id, user.id, reason);
      await auditoriaService.log({
        userId: user.id, actionType: 'document_rejected',
        entityType: 'driver_document', entityId: doc.id,
        description: `${resubmission ? 'Reenvío solicitado' : 'Documento rechazado'}: ${docLabel(doc.document_type)}. ${reason}`,
      }).catch(() => {});
      toast.success(resubmission ? 'Se solicitó el reenvío' : 'Documento rechazado');
      await refreshDetail();
    } catch (e) {
      toast.error('Error al actualizar el documento');
    }
  };

  const handleApproveDriver = async () => {
    if (!selectedDriver || !user) return;
    const toApprove = driverDocs.filter(d => d.status !== 'approved');
    if (!window.confirm(
      `Vas a aprobar a ${fullName(selectedDriver)} como cadete.\n\n` +
      `• Se aprobarán AUTOMÁTICAMENTE todos sus documentos (${toApprove.length} sin aprobar).\n` +
      `• Quedará habilitado para trabajar de inmediato.\n\n` +
      `Si querés revisar documento por documento, cancelá y usá los botones de cada documento.\n\n` +
      `¿Confirmás la aprobación total?`
    )) return;
    try {
      // Aprueba todos los documentos que falten y activa al cadete.
      for (const d of toApprove) {
        await driversService.approveDocument(d.id, user.id);
      }
      await driversService.setDriverStatus(selectedDriver.id, 'active');
      await auditoriaService.log({
        userId: user.id, actionType: 'driver_approved', entityType: 'profile',
        entityId: selectedDriver.id,
        description: `Cadete aprobado: ${fullName(selectedDriver)} (${toApprove.length} documentos aprobados)`,
      }).catch(() => {});
      toast.success('Cadete aprobado y habilitado');
      setSelectedDriver(null);
      loadData();
    } catch (e) {
      toast.error(`No se pudo aprobar: ${e instanceof Error ? e.message : ''}`);
    }
  };

  const columns = [
    {
      key: 'driver',
      header: 'Conductor',
      render: (g: DriverGroup) => (
        <div className="flex items-center gap-3">
          {g.driver.avatar
            ? <img src={getPublicUrl(g.driver.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
            : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">{fullName(g.driver).charAt(0)}</div>}
          <div>
            <p className="font-medium text-gray-900">{fullName(g.driver)}</p>
            <p className="text-xs text-gray-500">{g.driver.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'docs',
      header: 'Documentos pendientes',
      render: (g: DriverGroup) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{g.docs.length}</span>
          <span className="text-sm text-gray-600 truncate max-w-[260px]">
            {g.docs.map(d => docLabel(d.document_type)).join(', ')}
          </span>
        </div>
      ),
    },
    {
      key: 'lastUpload',
      header: 'Último',
      render: (g: DriverGroup) => <span className="text-sm text-gray-600">{new Date(g.lastUpload).toLocaleDateString('es-AR')}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (g: DriverGroup) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openDriverDetail(g.driver); }} className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Ver detalle
          </button>
          {phoneDigits(g.driver) && (
            <a onClick={(e) => e.stopPropagation()} href={`https://wa.me/${phoneDigits(g.driver)}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Contactar">
              <Phone className="w-5 h-5" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout title="Gestión KYC">
      <div className="p-10">
        <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900">Gestión KYC</h1></div>

        <div className="mb-6 grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-cyan-50 rounded-2xl p-5">
            <p className="text-3xl font-bold text-gray-900">{groups.length}</p>
            <p className="text-gray-600 text-sm">Cadetes por revisar</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-5">
            <p className="text-3xl font-bold text-gray-900">{pendingDocs.length}</p>
            <p className="text-gray-600 text-sm">Documentos pendientes</p>
          </div>
        </div>

        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nombre del conductor..."
            value={searchName} onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredGroups}
          loading={loading}
          onRowClick={(g: DriverGroup) => openDriverDetail(g.driver)}
          emptyMessage="No hay cadetes con documentos pendientes"
        />
      </div>

      {/* Detalle del cadete */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedDriver(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {selectedDriver.avatar
                    ? <img src={getPublicUrl(selectedDriver.avatar)} alt="" className="w-12 h-12 rounded-full object-cover" />
                    : <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-semibold">{fullName(selectedDriver).charAt(0)}</div>}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{fullName(selectedDriver)}</h3>
                    <p className="text-sm text-gray-500">{selectedDriver.email} · {selectedDriver.driver_type || 'cadete'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDriver(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              {/* Acciones del cadete */}
              <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
                <button onClick={handleApproveDriver} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" /> Aprobar cadete
                </button>
                {phoneDigits(selectedDriver) && (
                  <a href={`https://wa.me/${phoneDigits(selectedDriver)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4" /> Contactar por WhatsApp
                  </a>
                )}
                <button onClick={refreshDetail} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4" /> Actualizar
                </button>
              </div>

              {/* Documentos */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {detailLoading ? (
                  <p className="text-center text-gray-500 py-10">Cargando documentos...</p>
                ) : driverDocs.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">Este cadete no tiene documentos cargados.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {driverDocs.map(doc => (
                      <div key={doc.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => setZoomUrl(getPublicUrl(doc.file_url))} className="block w-full bg-gray-100 h-40 overflow-hidden">
                          <img src={getPublicUrl(doc.file_url)} alt={doc.document_type} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                        </button>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{docLabel(doc.document_type)}</span>
                            {statusBadge(doc.status)}
                          </div>
                          {doc.rejection_reason && <p className="text-xs text-red-600 mb-2">Motivo: {doc.rejection_reason}</p>}
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => handleApproveDoc(doc)} disabled={doc.status === 'approved'} className="flex-1 min-w-[90px] px-2 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                            </button>
                            <button onClick={() => handleRejectDoc(doc, true)} className="flex-1 min-w-[90px] px-2 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center gap-1" title="Pedir que lo reenvíe">
                              <RefreshCw className="w-3.5 h-3.5" /> Reenvío
                            </button>
                            <button onClick={() => handleRejectDoc(doc, false)} disabled={doc.status === 'rejected'} className="flex-1 min-w-[90px] px-2 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Rechazar
                            </button>
                          </div>
                          <a href={getPublicUrl(doc.file_url)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <Download className="w-3.5 h-3.5" /> Descargar / ver original
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom de imagen */}
      {zoomUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6" onClick={() => setZoomUrl(null)}>
          <img src={zoomUrl} alt="documento" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </Layout>
  );
};

export default KYCPage;
