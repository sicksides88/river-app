import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import {
  FileText,
  Edit2,
  Eye,
  Plus,
  Loader2,
  X,
  Check,
  Archive,
  RotateCcw,
  Trash2,
  History,
  Clock,
} from 'lucide-react';
import {
  legalesService,
  type LegalDocument,
  type LegalDocumentVersion,
  type DocumentType,
} from '../services';
import { useToast } from '../context/ToastContext';

const LegalesPage: React.FC = () => {
  const toast = useToast();

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [recentChanges, setRecentChanges] = useState<Array<LegalDocumentVersion & { document?: LegalDocument }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [versionHistory, setVersionHistory] = useState<LegalDocumentVersion[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    document_type: 'policy' as DocumentType,
    is_required: false,
    change_summary: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, changes] = await Promise.all([
        legalesService.getAll(),
        legalesService.getRecentChanges(5),
      ]);
      setDocuments(docs);
      setRecentChanges(changes);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await legalesService.create({
        title: formData.title,
        content: formData.content,
        document_type: formData.document_type,
        is_required: formData.is_required,
      });
      toast.success('Documento creado correctamente');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Error al crear el documento');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDocument) return;

    try {
      setSaving(true);
      await legalesService.update(selectedDocument.id, {
        title: formData.title,
        content: formData.content,
        document_type: formData.document_type,
        is_required: formData.is_required,
        change_summary: formData.change_summary || undefined,
      });
      toast.success('Documento actualizado correctamente');
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Error al actualizar el documento');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (doc: LegalDocument) => {
    try {
      await legalesService.publish(doc.id);
      toast.success('Documento publicado');
      loadData();
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Error al publicar el documento');
    }
  };

  const handleArchive = async (doc: LegalDocument) => {
    try {
      await legalesService.archive(doc.id);
      toast.success('Documento archivado');
      loadData();
    } catch (error) {
      console.error('Error archiving:', error);
      toast.error('Error al archivar el documento');
    }
  };

  const handleRestore = async (doc: LegalDocument) => {
    try {
      await legalesService.restoreToDraft(doc.id);
      toast.success('Documento restaurado a borrador');
      loadData();
    } catch (error) {
      console.error('Error restoring:', error);
      toast.error('Error al restaurar el documento');
    }
  };

  const handleDelete = async (doc: LegalDocument) => {
    if (!confirm(`¿Está seguro de eliminar "${doc.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await legalesService.delete(doc.id);
      toast.success('Documento eliminado');
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  const handleViewHistory = async (doc: LegalDocument) => {
    try {
      const history = await legalesService.getVersionHistory(doc.id);
      setVersionHistory(history);
      setSelectedDocument(doc);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar el historial');
    }
  };

  const openEditModal = (doc: LegalDocument) => {
    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      document_type: doc.document_type,
      is_required: doc.is_required,
      change_summary: '',
    });
    setShowEditModal(true);
  };

  const openViewModal = (doc: LegalDocument) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      document_type: 'policy',
      is_required: false,
      change_summary: '',
    });
    setSelectedDocument(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'terms', label: 'Términos y Condiciones' },
    { value: 'privacy', label: 'Política de Privacidad' },
    { value: 'contract', label: 'Contrato' },
    { value: 'policy', label: 'Política' },
    { value: 'agreement', label: 'Acuerdo' },
    { value: 'other', label: 'Otro' },
  ];

  return (
    <Layout title="Documentos Legales">
      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentos Legales</h1>
            <p className="text-gray-600 mt-1">
              Gestiona los documentos legales y políticas de la plataforma
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo documento
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid de documentos */}
            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay documentos legales</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                  Crear el primer documento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${legalesService.getStatusColor(doc.status)}`}>
                        {legalesService.getStatusLabel(doc.status)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {legalesService.getDocumentTypeLabel(doc.document_type)}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">Versión {doc.version}</p>

                    <div className="text-sm text-gray-500 mb-4">
                      Última actualización: {formatDate(doc.updated_at)}
                    </div>

                    {doc.is_required && (
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full mb-4">
                        Requerido
                      </span>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewModal(doc)}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </button>
                      <button
                        onClick={() => openEditModal(doc)}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {doc.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(doc)}
                          className="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-medium hover:bg-green-200 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Publicar
                        </button>
                      )}
                      {doc.status === 'published' && (
                        <button
                          onClick={() => handleArchive(doc)}
                          className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Archive className="w-3 h-3 mr-1" />
                          Archivar
                        </button>
                      )}
                      {doc.status === 'archived' && (
                        <button
                          onClick={() => handleRestore(doc)}
                          className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium hover:bg-blue-200 flex items-center justify-center"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restaurar
                        </button>
                      )}
                      <button
                        onClick={() => handleViewHistory(doc)}
                        className="py-2 px-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 flex items-center justify-center"
                        title="Ver historial"
                      >
                        <History className="w-3 h-3" />
                      </button>
                      {doc.status !== 'published' && (
                        <button
                          onClick={() => handleDelete(doc)}
                          className="py-2 px-3 bg-red-100 text-red-600 rounded-xl text-xs font-medium hover:bg-red-200 flex items-center justify-center"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Historial de cambios recientes */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Cambios Recientes</h3>
              </div>
              <div className="p-6">
                {recentChanges.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Sin cambios recientes</p>
                ) : (
                  <div className="space-y-4">
                    {recentChanges.map((change) => (
                      <div
                        key={change.id}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {change.document?.title || 'Documento'} v{change.version}
                            </p>
                            <p className="text-sm text-gray-500">
                              {change.change_summary || 'Actualización de contenido'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(change.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Nuevo Documento Legal</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Política de Privacidad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value as DocumentType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-64 font-mono text-sm"
                  placeholder="# Título&#10;&#10;## Sección 1&#10;Contenido..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_required" className="text-sm text-gray-700">
                  Documento requerido (usuarios deben aceptarlo)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.title || !formData.content}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Editar Documento</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value as DocumentType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-64 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resumen del cambio (opcional)
                </label>
                <input
                  type="text"
                  value={formData.change_summary}
                  onChange={(e) => setFormData({ ...formData, change_summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Actualización de cláusulas de pago"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="edit_is_required" className="text-sm text-gray-700">
                  Documento requerido
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving || !formData.title || !formData.content}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{selectedDocument.title}</h2>
                <p className="text-sm text-gray-500">Versión {selectedDocument.version}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedDocument.content}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedDocument);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistoryModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Historial de Versiones</h2>
                <p className="text-sm text-gray-500">{selectedDocument.title}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {versionHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay versiones anteriores</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versionHistory.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">Versión {version.version}</span>
                        <span className="text-sm text-gray-500">{formatDate(version.created_at)}</span>
                      </div>
                      {version.change_summary && (
                        <p className="text-sm text-gray-600 mb-2">{version.change_summary}</p>
                      )}
                      {version.creator && (
                        <p className="text-xs text-gray-400">
                          Por {version.creator.nombre} {version.creator.apellido}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LegalesPage;
