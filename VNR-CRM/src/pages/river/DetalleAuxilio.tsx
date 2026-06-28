import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { auxilioAdminService, AdminAuxilio } from '../../services/auxilioAdmin.service';
import RiverMap from '../../components/map/RiverMap';
import type { NativeMarkerSpec } from '../../components/map/useNativeMapMarkers';
import {
  getAuxilioPickupCoords,
  getDriverCoords,
} from '../../utils/mapCoords';
import {
  getAuxilioLifecycle,
  getAuxilioStatusLabel,
  getEmergencyTypeLabel,
  getLifecycleLabel,
  getPriorityLabel,
  isDangerEmergency,
  PHOTO_PHASE_LABELS,
  TIMELINE_EVENT_LABELS,
} from '../../constants/auxilioLabels';
import {
  AlertTriangle,
  Anchor,
  ArrowLeft,
  Calendar,
  Camera,
  Clock,
  ExternalLink,
  Flag,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Ship,
  User,
  Wrench,
} from 'lucide-react';

const lifecycleStyles = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/20',
  pending: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
  done: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  cancelled: 'bg-red-50 text-red-800 border-red-200 ring-red-500/20',
};

function SectionCard({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-blue-600 shrink-0" />}
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: 'danger' | 'warning' | 'default';
}) {
  const tone =
    highlight === 'danger'
      ? 'border-red-100 bg-red-50/50'
      : highlight === 'warning'
        ? 'border-amber-100 bg-amber-50/50'
        : 'border-gray-100 bg-gray-50/50';

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-white border border-gray-100 shrink-0">
            <Icon className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  title,
  name,
  phone,
  email,
  emptyText,
  icon: Icon,
}: {
  title: string;
  name?: string;
  phone?: string;
  email?: string;
  emptyText: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const hasPerson = Boolean(name?.trim());
  return (
    <SectionCard title={title} icon={Icon}>
      {hasPerson ? (
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2 min-w-0">
            <p className="font-semibold text-gray-900">{name}</p>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
              >
                <Phone className="w-4 h-4 shrink-0" />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 truncate"
              >
                {email}
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">{emptyText}</p>
      )}
    </SectionCard>
  );
}

const DetalleAuxilio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auxilio, setAuxilio] = useState<AdminAuxilio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await auxilioAdminService.getAuxilio(id);
      setAuxilio(r.auxilio);
    } catch {
      if (!silent) setAuxilio(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const coords = useMemo(() => (auxilio ? getAuxilioPickupCoords(auxilio) : null), [auxilio]);
  const rescueCoords = useMemo(() => (auxilio ? getDriverCoords(auxilio) : null), [auxilio]);

  const mapCenter = coords || rescueCoords || { lat: -34.6037, lng: -58.3816 };

  const detailMapMarkers = useMemo((): NativeMarkerSpec[] => {
    const list: NativeMarkerSpec[] = [];
    if (coords) {
      list.push({
        id: 'pickup',
        position: coords,
        color: '#ef4444',
        title: 'Navegante — auxilio solicitado',
        zIndex: 20,
      });
    }
    if (rescueCoords) {
      list.push({
        id: 'rescue',
        position: rescueCoords,
        color: '#059669',
        title: 'Embarcación de auxilio',
        zIndex: 30,
      });
    }
    return list;
  }, [coords, rescueCoords]);

  if (loading && !auxilio) {
    return (
      <Layout title="Detalle del auxilio">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Cargando auxilio…</p>
        </div>
      </Layout>
    );
  }

  if (!auxilio) {
    return (
      <Layout title="Detalle del auxilio">
        <div className="max-w-lg mx-auto text-center py-16">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900">Auxilio no encontrado</h1>
          <p className="text-sm text-gray-500 mt-2">El identificador no existe o ya no está disponible.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-6 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const lifecycle = getAuxilioLifecycle(auxilio.riverStatus, auxilio.status);
  const statusLabel = getAuxilioStatusLabel(auxilio.riverStatus, auxilio.status);
  const emergencyLabel = getEmergencyTypeLabel(auxilio.emergencyType);
  const danger = isDangerEmergency(auxilio.emergencyType);
  const photos = auxilio.photos || {};
  const failureDetail =
    auxilio.failureTypes && auxilio.failureTypes.length > 0
      ? auxilio.failureTypes.join(' · ')
      : '—';
  const vesselTitle =
    auxilio.vessel?.name || auxilio.vesselName || 'Embarcación sin nombre';
  const registration = auxilio.vessel?.registration;

  return (
    <Layout title="Detalle del auxilio">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Actualizando…
            </span>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          {lifecycle === 'pending' && (
            <Link
              to="/despacho"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ir a despacho
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Encabezado */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ring-2 ${lifecycleStyles[lifecycle]}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    lifecycle === 'active'
                      ? 'bg-emerald-500 animate-pulse'
                      : lifecycle === 'pending'
                        ? 'bg-amber-500'
                        : lifecycle === 'done'
                          ? 'bg-slate-400'
                          : 'bg-red-500'
                  }`}
                />
                {getLifecycleLabel(lifecycle)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20">
                {statusLabel}
              </span>
              {danger && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/90 text-white">
                  Emergencia crítica
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ship className="w-7 h-7 shrink-0 opacity-90" />
              {vesselTitle}
            </h1>
            {registration && (
              <p className="text-sm text-white/70 mt-1">Matrícula: {registration}</p>
            )}
            <p className="text-sm text-white/80 mt-3 flex items-start gap-2">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              {auxilio.pickup?.address || 'Sin dirección de referencia'}
            </p>
          </div>
          <div className="shrink-0 text-right text-sm text-white/70 space-y-1">
            {auxilio.created_at && (
              <p className="flex items-center justify-end gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(auxilio.created_at).toLocaleString('es-AR')}
              </p>
            )}
            <p className="font-mono text-xs text-white/50 truncate max-w-[220px] ml-auto">
              ID {auxilio.id.slice(0, 8)}…
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Mapa */}
          <SectionCard title="Ubicación en el mapa" icon={MapPin}>
            {coords || rescueCoords ? (
              <>
                <div className="flex flex-wrap gap-4 mb-3 text-xs">
                  <span className="flex items-center gap-1.5 text-red-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Navegante (auxilio solicitado)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Embarcación de auxilio
                  </span>
                </div>
                <RiverMap
                  height="320px"
                  center={mapCenter}
                  markers={detailMapMarkers}
                />
                {coords && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-600">
                    <strong className="text-gray-900">Navegante — Lat:</strong> {coords.lat.toFixed(5)}
                  </span>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">Lng:</strong> {coords.lng.toFixed(5)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Abrir navegante en Maps
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                )}
                {rescueCoords && (
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-gray-600">
                      <strong className="text-gray-900">Embarcación auxilio — Lat:</strong>{' '}
                      {rescueCoords.lat.toFixed(5)}
                    </span>
                    <span className="text-gray-600">
                      <strong className="text-gray-900">Lng:</strong> {rescueCoords.lng.toFixed(5)}
                    </span>
                    {auxilio.driverLocation?.updatedAt && (
                      <span className="text-xs text-gray-400">
                        GPS actualizado:{' '}
                        {new Date(auxilio.driverLocation.updatedAt).toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                )}
                {!rescueCoords && auxilio.driver && (
                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Hay patrón asignado pero aún no hay ubicación GPS reciente de la embarcación de
                    auxilio.
                  </p>
                )}
              </>
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sin coordenadas GPS registradas</p>
              </div>
            )}
          </SectionCard>

          {/* Resumen operativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoTile
              label="Tipo de auxilio"
              value={emergencyLabel}
              icon={AlertTriangle}
              highlight={danger ? 'danger' : 'default'}
            />
            <InfoTile
              label="Detalle del problema"
              value={failureDetail}
              icon={Wrench}
            />
            <InfoTile
              label="Tiempo estimado (ETA)"
              value={auxilio.etaMinutes ? `${auxilio.etaMinutes} minutos` : 'Sin ETA'}
              icon={Clock}
            />
            <InfoTile
              label="Prioridad en cola"
              value={getPriorityLabel(auxilio.priority, auxilio.priorityOverride)}
              icon={Flag}
              highlight={
                (auxilio.priorityOverride ?? auxilio.priority) === 0 ? 'danger' : 'default'
              }
            />
          </div>

          {/* Timeline */}
          <SectionCard title="Historial del servicio" icon={Clock}>
            {(auxilio.timeline || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Todavía no hay eventos registrados</p>
            ) : (
              <ol className="relative border-l-2 border-blue-100 ml-3 space-y-6">
                {[...(auxilio.timeline || [])].reverse().map((t, i) => (
                  <li key={`${t.event}-${i}`} className="ml-6 relative">
                    <span className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                    <p className="text-sm font-semibold text-gray-900">
                      {TIMELINE_EVENT_LABELS[t.event] || t.event.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(t.at).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          {/* Fotos */}
          <SectionCard title="Registro fotográfico y firma" icon={Camera}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['before', 'during', 'after'] as const).map((phase) => (
                <div key={phase}>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {PHOTO_PHASE_LABELS[phase]}
                  </p>
                  {photos[phase] ? (
                    <a href={photos[phase]} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photos[phase]}
                        alt={PHOTO_PHASE_LABELS[phase]}
                        className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-xs">Sin foto</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {auxilio.signature && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Firma del navegante</p>
                <img
                  src={auxilio.signature}
                  alt="Firma"
                  className="max-h-28 border border-gray-200 rounded-xl bg-white p-2"
                />
              </div>
            )}
          </SectionCard>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <PersonCard
            title="Navegante solicitante"
            icon={User}
            name={
              auxilio.user
                ? `${auxilio.user.nombre || ''} ${auxilio.user.apellido || ''}`.trim()
                : undefined
            }
            phone={auxilio.user?.telefono_numero}
            email={auxilio.user?.email}
            emptyText="Sin datos del navegante"
          />

          <PersonCard
            title="Patrón asignado"
            icon={Anchor}
            name={
              auxilio.driver
                ? `${auxilio.driver.nombre || ''} ${auxilio.driver.apellido || ''}`.trim()
                : undefined
            }
            phone={auxilio.driver?.telefono_numero}
            emptyText="Todavía no hay patrón asignado"
          />

          {(auxilio.accepted_at || auxilio.completed_at) && (
            <SectionCard title="Fechas clave" icon={Calendar}>
              <dl className="space-y-3 text-sm">
                {auxilio.accepted_at && (
                  <div>
                    <dt className="text-gray-500">Asignación</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(auxilio.accepted_at).toLocaleString('es-AR')}
                    </dd>
                  </div>
                )}
                {auxilio.completed_at && (
                  <div>
                    <dt className="text-gray-500">Finalización</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(auxilio.completed_at).toLocaleString('es-AR')}
                    </dd>
                  </div>
                )}
              </dl>
            </SectionCard>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DetalleAuxilio;
