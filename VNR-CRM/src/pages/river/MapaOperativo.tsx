import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { Layout } from '../../components/layout';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import useNativeMapMarkers, {
  NativeMarkerSpec,
} from '../../components/map/useNativeMapMarkers';
import {
  auxilioAdminService,
  AdminAuxilio,
  PatrolOnDuty,
} from '../../services/auxilioAdmin.service';
import { getEmergencyTypeLabel } from '../../constants/auxilioLabels';
import {
  fitMapToPoints,
  getAuxilioPickupCoords,
  getDriverCoords,
  parseCoord,
} from '../../utils/mapCoords';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';

const containerStyle = { width: '100%', height: 'calc(100vh - 280px)', minHeight: '420px' };
const defaultCenter = { lat: -34.6037, lng: -58.3816 };

type MapSelection =
  | { type: 'auxilio-pickup'; auxilio: AdminAuxilio }
  | { type: 'auxilio-rescue'; auxilio: AdminAuxilio }
  | { type: 'patrol'; patrol: PatrolOnDuty };

const MapaOperativo: React.FC = () => {
  const [patrols, setPatrols] = useState<PatrolOnDuty[]>([]);
  const [auxilios, setAuxilios] = useState<AdminAuxilio[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MapSelection | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  const load = useCallback(async (silent = false) => {
    if (!silent) setInitialLoading(true);
    else setRefreshing(true);
    try {
      const [patrolRes, auxilioRes] = await Promise.all([
        auxilioAdminService.listPatrolsOnDuty(),
        auxilioAdminService.listAuxilios('active'),
      ]);
      setPatrols(patrolRes.patrols || []);
      setAuxilios(auxilioRes.auxilios || []);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 20000);
    return () => clearInterval(id);
  }, [load]);

  const assignedDriverIds = useMemo(
    () => new Set(auxilios.map((a) => a.driver?.id).filter(Boolean)),
    [auxilios]
  );

  const auxiliosWithPickup = useMemo(
    () => auxilios.filter((a) => getAuxilioPickupCoords(a)),
    [auxilios]
  );

  const auxiliosWithRescue = useMemo(
    () => auxilios.filter((a) => getDriverCoords(a)),
    [auxilios]
  );

  const mapMarkers = useMemo((): NativeMarkerSpec[] => {
    const list: NativeMarkerSpec[] = [];

    patrols.forEach((p) => {
      if (assignedDriverIds.has(p.id)) return;
      const lat = parseCoord(p.location?.lat);
      const lng = parseCoord(p.location?.lng);
      if (lat == null || lng == null) return;
      list.push({
        id: `patrol-${p.id}`,
        position: { lat, lng },
        color: '#2563eb',
        title: `Patrón: ${p.nombre || ''} ${p.apellido || ''}`.trim(),
        zIndex: 10,
        onClick: () => setSelected({ type: 'patrol', patrol: p }),
      });
    });

    auxilios.forEach((a) => {
      const pickup = getAuxilioPickupCoords(a);
      if (pickup) {
        const label =
          a.vessel?.name || a.vesselName || getEmergencyTypeLabel(a.emergencyType);
        list.push({
          id: `pickup-${a.id}`,
          position: pickup,
          color: '#ef4444',
          title: `Navegante: ${label}`,
          zIndex: 30,
          onClick: () => setSelected({ type: 'auxilio-pickup', auxilio: a }),
        });
      }
      const rescue = getDriverCoords(a);
      if (rescue) {
        const patronName = a.driver
          ? `${a.driver.nombre || ''} ${a.driver.apellido || ''}`.trim()
          : 'Patrón';
        list.push({
          id: `rescue-${a.id}`,
          position: rescue,
          color: '#059669',
          title: `Embarcación auxilio: ${patronName}`,
          zIndex: 40,
          onClick: () => setSelected({ type: 'auxilio-rescue', auxilio: a }),
        });
      }
    });

    return list;
  }, [patrols, auxilios, assignedDriverIds]);

  const mapPoints = useMemo(() => mapMarkers.map((m) => m.position), [mapMarkers]);

  const onMapLoad = useCallback(
    (instance: google.maps.Map) => {
      setMap(instance);
      if (mapPoints.length) fitMapToPoints(instance, mapPoints);
      else {
        instance.setCenter(defaultCenter);
        instance.setZoom(11);
      }
    },
    [mapPoints]
  );

  useEffect(() => {
    if (map && mapPoints.length) fitMapToPoints(map, mapPoints);
  }, [map, mapPoints]);

  useNativeMapMarkers(map, mapMarkers, isLoaded && !!map);

  return (
    <Layout title="Mapa operativo">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa operativo</h1>
          <p className="text-sm text-gray-500 mt-1">
            {patrols.length} patrones en guardia · {auxilios.length} auxilios activos ·{' '}
            {auxiliosWithPickup.length} con ubicación del navegante · {auxiliosWithRescue.length}{' '}
            con embarcación de auxilio
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Navegante (auxilio solicitado)
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600" />
          Embarcación de auxilio (patrón asignado)
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          Patrón en guardia
        </span>
      </div>

      {loadError && (
        <p className="text-red-600 text-sm mb-4">Error cargando Google Maps</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 relative">
          {!isLoaded || initialLoading ? (
            <div className="flex justify-center py-24 bg-gray-50 rounded-xl border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <GoogleMap
                mapContainerStyle={containerStyle}
                onLoad={onMapLoad}
                options={{ fullscreenControl: true, streetViewControl: false }}
              >
                {selected?.type === 'auxilio-pickup' &&
                  getAuxilioPickupCoords(selected.auxilio) && (
                    <InfoWindow
                      position={getAuxilioPickupCoords(selected.auxilio)!}
                      onCloseClick={() => setSelected(null)}
                    >
                      <div className="text-sm max-w-[220px]">
                        <p className="font-semibold text-red-700">Navegante — auxilio</p>
                        <p className="font-medium mt-1">
                          {selected.auxilio.vessel?.name ||
                            selected.auxilio.vesselName ||
                            'Embarcación'}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          {getEmergencyTypeLabel(selected.auxilio.emergencyType)}
                        </p>
                        <Link
                          to={`/auxilios/${selected.auxilio.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 text-xs mt-2 hover:underline"
                        >
                          Ver detalle
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </InfoWindow>
                  )}

                {selected?.type === 'auxilio-rescue' && getDriverCoords(selected.auxilio) && (
                  <InfoWindow
                    position={getDriverCoords(selected.auxilio)!}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div className="text-sm max-w-[220px]">
                      <p className="font-semibold text-emerald-700">Embarcación de auxilio</p>
                      <p className="font-medium mt-1">
                        {selected.auxilio.driver
                          ? `${selected.auxilio.driver.nombre || ''} ${selected.auxilio.driver.apellido || ''}`.trim()
                          : 'Patrón asignado'}
                      </p>
                      <Link
                        to={`/auxilios/${selected.auxilio.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 text-xs mt-2 hover:underline"
                      >
                        Ver auxilio
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </InfoWindow>
                )}

                {selected?.type === 'patrol' &&
                  parseCoord(selected.patrol.location?.lat) != null &&
                  parseCoord(selected.patrol.location?.lng) != null && (
                    <InfoWindow
                      position={{
                        lat: parseCoord(selected.patrol.location!.lat)!,
                        lng: parseCoord(selected.patrol.location!.lng)!,
                      }}
                      onCloseClick={() => setSelected(null)}
                    >
                      <div className="text-sm">
                        <p className="font-semibold text-blue-700">Patrón en guardia</p>
                        <p className="font-medium mt-1">
                          {`${selected.patrol.nombre || ''} ${selected.patrol.apellido || ''}`.trim()}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
              </GoogleMap>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Auxilios en mapa</h2>
          {auxilios.length === 0 ? (
            <p className="text-sm text-gray-400">No hay auxilios activos</p>
          ) : (
            auxilios.map((a) => {
              const pickup = getAuxilioPickupCoords(a);
              const rescue = getDriverCoords(a);
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-gray-100 p-3 text-sm shadow-sm"
                >
                  <p className="font-medium text-gray-900 truncate">
                    {a.vessel?.name || a.vesselName || a.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getEmergencyTypeLabel(a.emergencyType)}
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className={pickup ? 'text-red-600' : 'text-gray-400'}>
                      {pickup ? '● Navegante en mapa' : '○ Sin GPS del navegante'}
                    </p>
                    <p className={rescue ? 'text-emerald-600' : 'text-gray-400'}>
                      {rescue
                        ? '● Embarcación auxilio en mapa'
                        : a.driver
                          ? '○ Patrón sin GPS reciente'
                          : '○ Sin patrón asignado'}
                    </p>
                  </div>
                  <Link
                    to={`/auxilios/${a.id}`}
                    className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </div>
              );
            })
          )}
        </aside>
      </div>
    </Layout>
  );
};

export default MapaOperativo;
