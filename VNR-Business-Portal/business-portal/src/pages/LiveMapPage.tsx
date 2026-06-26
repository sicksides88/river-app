import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { businessService, type Delivery } from '../services/business.service';
import { useBusinessTracking } from '../hooks/useBusinessTracking';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, MapPin, Bike, Clock, CheckCircle2 } from 'lucide-react';

const defaultCenter = { lat: -31.4201, lng: -64.1888 };

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  arrived_pickup: 'En origen',
  picked_up: 'Retirado',
  in_transit: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  arrived_pickup: 'bg-indigo-100 text-indigo-700',
  picked_up: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

const LiveMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  // Solo IDs de envíos activos (no entregados ni cancelados)
  const activeDeliveryIds = useMemo(
    () => deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status)).map(d => d.id),
    [deliveries]
  );

  const tracking = useBusinessTracking(activeDeliveryIds);

  const loadDeliveries = async () => {
    try {
      // Traer envíos activos (no entregados/cancelados)
      const result = await businessService.getDeliveries({ limit: 50 });
      const active = result.data.filter(d => !['delivered', 'cancelled'].includes(d.status));
      setDeliveries(active);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 30000); // Refrescar cada 30s
    return () => clearInterval(interval);
  }, []);

  // Combinar ubicaciones de API con las de socket en tiempo real
  const getDeliveryDriverPos = (delivery: Delivery): { lat: number; lng: number } | null => {
    const socketLoc = tracking.getDriverLocation(delivery.id);
    if (socketLoc) return { lat: socketLoc.lat, lng: socketLoc.lng };
    return null;
  };

  const getDeliveryStatus = (delivery: Delivery): string => {
    return tracking.getStatus(delivery.id) || delivery.status;
  };

  // Calcular centro del mapa
  const mapCenter = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];
    deliveries.forEach(d => {
      const driverPos = getDeliveryDriverPos(d);
      if (driverPos) points.push(driverPos);
      if (d.pickup_lat && d.pickup_lng) points.push({ lat: d.pickup_lat, lng: d.pickup_lng });
      if (d.dropoff_lat && d.dropoff_lng) points.push({ lat: d.dropoff_lat, lng: d.dropoff_lng });
    });
    if (points.length === 0) return defaultCenter;
    const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return { lat: avgLat, lng: avgLng };
  }, [deliveries, tracking.driverLocations]);

  const withDriver = deliveries.filter(d => d.driver_id);
  const withoutDriver = deliveries.filter(d => !d.driver_id);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Panel lateral */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Envíos activos</h2>
              <button
                onClick={() => { setLoading(true); loadDeliveries(); }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" />
                {withDriver.length} con cadete
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {withoutDriver.length} sin asignar
              </span>
              {tracking.connected && (
                <span className="flex items-center gap-1 text-green-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  En vivo
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {deliveries.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay envíos activos</p>
              </div>
            ) : (
              deliveries.map(d => {
                const status = getDeliveryStatus(d);
                const hasDriver = !!d.driver_id;
                const isSelected = selectedDelivery === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDelivery(isSelected ? null : d.id)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{d.tracking_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[status] || status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{d.dropoff_address}</p>
                    {hasDriver && d.driver && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        {d.driver.nombre} {d.driver.apellido}
                      </p>
                    )}
                    {!hasDriver && (
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Esperando cadete
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1">
          {!isLoaded ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400">Cargando mapa...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={13}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
              {deliveries.map(d => {
                const driverPos = getDeliveryDriverPos(d);
                const isSelected = selectedDelivery === d.id;

                return (
                  <React.Fragment key={d.id}>
                    {/* Marker del cadete */}
                    {driverPos && (
                      <>
                        <Marker
                          position={driverPos}
                          onClick={() => setSelectedDelivery(d.id)}
                          icon={{
                            url: `data:image/svg+xml,${encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="${isSelected ? '#2563eb' : '#111827'}" stroke="white" stroke-width="3"/>
                                <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">C</text>
                              </svg>
                            `)}`,
                            scaledSize: new google.maps.Size(36, 36),
                          }}
                        />
                        {isSelected && (
                          <InfoWindow
                            position={driverPos}
                            onCloseClick={() => setSelectedDelivery(null)}
                          >
                            <div className="p-1 min-w-[180px]">
                              <p className="font-semibold text-sm">{d.driver?.nombre} {d.driver?.apellido}</p>
                              <p className="text-xs text-gray-500 mt-1">{d.tracking_number}</p>
                              <p className="text-xs text-gray-500">{statusLabels[getDeliveryStatus(d)]}</p>
                              <p className="text-xs text-gray-500 truncate mt-1">→ {d.dropoff_address}</p>
                              <button
                                onClick={() => navigate(`/envios/${d.id}`)}
                                className="mt-2 text-xs text-blue-600 font-medium hover:underline"
                              >
                                Ver detalle
                              </button>
                            </div>
                          </InfoWindow>
                        )}
                      </>
                    )}

                    {/* Markers de pickup/dropoff solo si está seleccionado */}
                    {isSelected && d.pickup_lat && d.pickup_lng && (
                      <Marker
                        position={{ lat: d.pickup_lat, lng: d.pickup_lng }}
                        icon={{
                          url: `data:image/svg+xml,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                              <circle cx="14" cy="14" r="12" fill="#16a34a" stroke="white" stroke-width="2"/>
                              <text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="sans-serif">A</text>
                            </svg>
                          `)}`,
                          scaledSize: new google.maps.Size(28, 28),
                        }}
                      />
                    )}
                    {isSelected && d.dropoff_lat && d.dropoff_lng && (
                      <Marker
                        position={{ lat: d.dropoff_lat, lng: d.dropoff_lng }}
                        icon={{
                          url: `data:image/svg+xml,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                              <circle cx="14" cy="14" r="12" fill="#dc2626" stroke="white" stroke-width="2"/>
                              <text x="14" y="19" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="sans-serif">B</text>
                            </svg>
                          `)}`,
                          scaledSize: new google.maps.Size(28, 28),
                        }}
                      />
                    )}

                    {/* Si no tiene cadete, mostrar dropoff como referencia */}
                    {!driverPos && d.dropoff_lat && d.dropoff_lng && (
                      <Marker
                        position={{ lat: d.dropoff_lat, lng: d.dropoff_lng }}
                        onClick={() => setSelectedDelivery(d.id)}
                        icon={{
                          url: `data:image/svg+xml,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                              <circle cx="15" cy="15" r="13" fill="#eab308" stroke="white" stroke-width="2"/>
                              <text x="15" y="20" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="sans-serif">?</text>
                            </svg>
                          `)}`,
                          scaledSize: new google.maps.Size(30, 30),
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </GoogleMap>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LiveMapPage;
