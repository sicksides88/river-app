import React, { useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Layout } from '../components/layout';
import { MapLegend } from '../components/map';
import { useRealtimeDrivers } from '../hooks';
import { useToast } from '../context/ToastContext';
import { MapPin, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

// Estilo del contenedor del mapa
const containerStyle = {
  width: '100%',
  height: '100%',
};

// Opciones del mapa
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const MapaPage: React.FC = () => {
  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const { drivers, loading, error, refetch } = useRealtimeDrivers();
  const toast = useToast();

  // Cargar Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Filtrar conductores con coordenadas válidas
  const validDrivers = useMemo(() => {
    console.log('MapaPage - drivers recibidos:', drivers);
    const filtered = drivers.filter(d => d.current_latitude && d.current_longitude);
    console.log('MapaPage - validDrivers (con coordenadas):', filtered);
    return filtered;
  }, [drivers]);

  // Contar conductores disponibles
  const onlineCount = useMemo(() => {
    return validDrivers.filter(d => d.is_available).length;
  }, [validDrivers]);

  // Por ahora no hay campo is_busy, se puede agregar después
  const busyCount = 0;

  // Referencia a los marcadores creados
  const markersRef = React.useRef<google.maps.Marker[]>([]);

  // Centrar mapa y crear marcadores cuando cambien los conductores
  useEffect(() => {
    if (map && validDrivers.length > 0) {
      // Limpiar marcadores anteriores
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const firstDriver = validDrivers[0];
      if (firstDriver.current_latitude && firstDriver.current_longitude) {
        map.setCenter({
          lat: Number(firstDriver.current_latitude),
          lng: Number(firstDriver.current_longitude),
        });
        map.setZoom(15);
      }

      // Crear marcadores directamente con la API de Google Maps
      validDrivers.forEach(driver => {
        if (driver.current_latitude && driver.current_longitude) {
          const services = driver.driver?.selected_services || [];
          const primaryService = services.includes('fletes') ? 'fletes'
            : services.includes('cadete') ? 'cadete'
            : services.includes('chofer') ? 'chofer'
            : 'vuelta_segura';

          // Colores por servicio
          const colors: Record<string, string> = {
            vuelta_segura: '#22c55e', // Verde
            fletes: '#3b82f6',        // Azul
            cadete: '#f59e0b',        // Naranja
            chofer: '#8b5cf6',        // Violeta
          };

          const color = driver.is_available ? colors[primaryService] : '#9ca3af';

          // Íconos SVG por servicio
          const iconPaths: Record<string, string> = {
            vuelta_segura: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
            fletes: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
            cadete: 'M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1zM5 6h5v2H5z',
            chofer: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
          };

          const markerSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="${color}" stroke="white" stroke-width="3"/>
              <g transform="translate(10, 10) scale(1)" fill="white">
                <path d="${iconPaths[primaryService]}"/>
              </g>
            </svg>
          `;

          const marker = new google.maps.Marker({
            position: {
              lat: Number(driver.current_latitude),
              lng: Number(driver.current_longitude),
            },
            map: map,
            title: `${driver.driver?.nombre || 'Conductor'} - ${primaryService}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
              scaledSize: new google.maps.Size(44, 44),
              anchor: new google.maps.Point(22, 22),
            },
          });
          markersRef.current.push(marker);
        }
      });
    }

    return () => {
      // Limpiar marcadores al desmontar
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [map, validDrivers]);

  // Callback cuando el mapa se carga
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Si hay conductores, ajustar los límites para mostrar todos
    if (validDrivers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validDrivers.forEach(driver => {
        if (driver.current_latitude && driver.current_longitude) {
          bounds.extend({ lat: driver.current_latitude, lng: driver.current_longitude });
        }
      });
      map.fitBounds(bounds, 50);
    }
  }, [validDrivers]);

  // Callback cuando el mapa se desmonta
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Manejar actualización
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Mapa actualizado');
    } catch {
      toast.error('Error al actualizar el mapa');
    }
  };

  // Estado de carga de Google Maps
  if (loadError) {
    return (
      <Layout title="Mapa">
        <div className="bg-white rounded-2xl border border-gray-200 h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar Google Maps</h3>
            <p className="text-gray-500">
              Verifica que la API key de Google Maps esté configurada correctamente.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isLoaded) {
    return (
      <Layout title="Mapa">
        <div className="bg-white rounded-2xl border border-gray-200 h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mapa">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Conductores</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ubicacion en tiempo real de los conductores activos
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Banner de error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Contenedor del mapa */}
        <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden h-[calc(100vh-250px)]">
          {loading && validDrivers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Cargando conductores...</p>
              </div>
            </div>
          ) : validDrivers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin conductores activos</h3>
                <p className="text-gray-500">
                  No hay conductores en linea en este momento.
                </p>
              </div>
            </div>
          ) : (
            <>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={{ lat: -33.33151390, lng: -60.22780600 }}
                zoom={17}
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
              >
                {/* Los marcadores se crean en el useEffect con la API directa de Google Maps */}
              </GoogleMap>

              {/* Leyenda */}
              <MapLegend
                onlineCount={onlineCount}
                busyCount={busyCount}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MapaPage;
