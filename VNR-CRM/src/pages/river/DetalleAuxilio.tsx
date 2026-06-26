import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { auxilioAdminService, AdminAuxilio } from '../../services/auxilioAdmin.service';
import { Loader2 } from 'lucide-react';

const eventLabel: Record<string, string> = {
  accepted: 'Aceptado',
  assigned: 'Asignado (operador)',
  arribado: 'Arribo',
  zarpado: 'Zarpado',
  en_proceso: 'En proceso',
  regreso: 'Regreso',
  finalizado: 'Finalizado',
};

const DetalleAuxilio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auxilio, setAuxilio] = useState<AdminAuxilio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    auxilioAdminService
      .getAuxilio(id)
      .then((r) => setAuxilio(r.auxilio))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout title="Detalle auxilio">
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  if (!auxilio) {
    return (
      <Layout title="Detalle auxilio">
        <p className="text-gray-500">Auxilio no encontrado</p>
        <Link to="/river" className="text-blue-600 text-sm mt-4 inline-block">
          ← Volver
        </Link>
      </Layout>
    );
  }

  const photos = auxilio.photos || {};

  return (
    <Layout title="Detalle auxilio">
      <Link to="/river" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {auxilio.vessel?.name || auxilio.vesselName || 'Auxilio náutico'}
            </h1>
            <p className="text-sm text-gray-500 mb-4">{auxilio.pickup?.address}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Estado</span>
                <p className="font-medium">{auxilio.riverStatus || auxilio.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Emergencia</span>
                <p className="font-medium">{auxilio.emergencyType || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">ETA</span>
                <p className="font-medium">{auxilio.etaMinutes ? `${auxilio.etaMinutes} min` : '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Prioridad</span>
                <p className="font-medium">{auxilio.priorityOverride ?? auxilio.priority ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-4">Timeline</h2>
            {(auxilio.timeline || []).length === 0 ? (
              <p className="text-sm text-gray-400">Sin eventos registrados</p>
            ) : (
              <ol className="space-y-3">
                {(auxilio.timeline || []).map((t, i) => (
                  <li key={`${t.event}-${i}`} className="flex gap-3 text-sm">
                    <span className="text-gray-400 whitespace-nowrap">
                      {new Date(t.at).toLocaleString('es-AR')}
                    </span>
                    <span className="font-medium">{eventLabel[t.event] || t.event}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-4">Fotos y firma</h2>
            <div className="grid grid-cols-3 gap-4">
              {['before', 'during', 'after'].map((phase) => (
                <div key={phase}>
                  <p className="text-xs text-gray-500 mb-2 capitalize">{phase}</p>
                  {photos[phase] ? (
                    <img
                      src={photos[phase]}
                      alt={phase}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                      Sin foto
                    </div>
                  )}
                </div>
              ))}
            </div>
            {auxilio.signature && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Firma</p>
                <img src={auxilio.signature} alt="Firma" className="max-h-24 border rounded-lg" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-3">Navegante</h2>
            {auxilio.user ? (
              <div className="text-sm space-y-1">
                <p>{`${auxilio.user.nombre || ''} ${auxilio.user.apellido || ''}`.trim()}</p>
                <p className="text-gray-500">{auxilio.user.telefono_numero}</p>
                <p className="text-gray-500">{auxilio.user.email}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-3">Patrón asignado</h2>
            {auxilio.driver ? (
              <div className="text-sm space-y-1">
                <p>{`${auxilio.driver.nombre || ''} ${auxilio.driver.apellido || ''}`.trim()}</p>
                <p className="text-gray-500">{auxilio.driver.telefono_numero}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin asignar</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DetalleAuxilio;
