import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Layout } from '../../components/layout';
import {
  auxilioAdminService,
  AdminAuxilio,
  PatrolOnDuty,
} from '../../services/auxilioAdmin.service';
import { Loader2, RefreshCw } from 'lucide-react';

const containerStyle = { width: '100%', height: 'calc(100vh - 220px)' };
const defaultCenter = { lat: -34.6037, lng: -58.3816 };

const MapaOperativo: React.FC = () => {
  const [patrols, setPatrols] = useState<PatrolOnDuty[]>([]);
  const [auxilios, setAuxilios] = useState<AdminAuxilio[]>([]);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-river',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [patrolRes, auxilioRes] = await Promise.all([
        auxilioAdminService.listPatrolsOnDuty(),
        auxilioAdminService.listAuxilios('active'),
      ]);
      setPatrols(patrolRes.patrols || []);
      setAuxilios(auxilioRes.auxilios || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const center = useMemo(() => {
    const patrolWithLoc = patrols.find((p) => p.location?.lat && p.location?.lng);
    if (patrolWithLoc?.location) {
      return {
        lat: Number(patrolWithLoc.location.lat),
        lng: Number(patrolWithLoc.location.lng),
      };
    }

    const auxilioWithLoc = auxilios.find(
      (a) => a.pickup?.coordinates?.lat && a.pickup?.coordinates?.lng
    );
    if (auxilioWithLoc?.pickup?.coordinates) {
      return {
        lat: Number(auxilioWithLoc.pickup.coordinates.lat),
        lng: Number(auxilioWithLoc.pickup.coordinates.lng),
      };
    }

    return defaultCenter;
  }, [patrols, auxilios]);

  return (
    <Layout title="Mapa operativo">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa operativo</h1>
          <p className="text-sm text-gray-500">
            {patrols.length} patrones en guardia · {auxilios.length} auxilios activos
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          Patrón en guardia
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Auxilio activo
        </span>
      </div>

      {loadError && (
        <p className="text-red-600 text-sm mb-4">Error cargando Google Maps</p>
      )}

      {!isLoaded || loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={11}>
          {patrols.map((p) =>
            p.location?.lat && p.location?.lng ? (
              <Marker
                key={`patrol-${p.id}`}
                position={{ lat: Number(p.location.lat), lng: Number(p.location.lng) }}
                title={`Patrón: ${p.nombre || ''} ${p.apellido || ''}`.trim()}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#2563eb',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            ) : null
          )}
          {auxilios.map((a) => {
            const lat = a.pickup?.coordinates?.lat;
            const lng = a.pickup?.coordinates?.lng;
            if (!lat || !lng) return null;
            return (
              <Marker
                key={`auxilio-${a.id}`}
                position={{ lat: Number(lat), lng: Number(lng) }}
                title={`Auxilio: ${a.vesselName || a.emergencyType || a.id.slice(0, 8)}`}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 9,
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            );
          })}
        </GoogleMap>
      )}
    </Layout>
  );
};

export default MapaOperativo;
