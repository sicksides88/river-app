import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Layout } from '../../components/layout';
import { auxilioAdminService, PatrolOnDuty } from '../../services/auxilioAdmin.service';
import { Loader2, RefreshCw } from 'lucide-react';

const containerStyle = { width: '100%', height: 'calc(100vh - 180px)' };
const defaultCenter = { lat: -34.6037, lng: -58.3816 };

const MapaOperativo: React.FC = () => {
  const [patrols, setPatrols] = useState<PatrolOnDuty[]>([]);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-river',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auxilioAdminService.listPatrolsOnDuty();
      setPatrols(res.patrols || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const center =
    patrols.find((p) => p.location?.lat && p.location?.lng)?.location
      ? {
          lat: Number(patrols[0].location!.lat),
          lng: Number(patrols[0].location!.lng),
        }
      : defaultCenter;

  return (
    <Layout title="Mapa operativo">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patrullas en guardia</h1>
          <p className="text-sm text-gray-500">{patrols.length} patrones con auxilio activo</p>
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
                key={p.id}
                position={{ lat: Number(p.location.lat), lng: Number(p.location.lng) }}
                title={`${p.nombre || ''} ${p.apellido || ''}`.trim()}
              />
            ) : null
          )}
        </GoogleMap>
      )}
    </Layout>
  );
};

export default MapaOperativo;
