import React from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Phone, Navigation, Car, Truck, Bike, User } from 'lucide-react';
import type { DriverAvailability, Profile, DriverService } from '../../types/database';

interface DriverMarkerProps {
  driver: DriverAvailability & { driver?: Profile };
  isSelected: boolean;
  onSelect: (driverId: string | null) => void;
}

// Configuración de servicios con colores e íconos
const serviceConfig: Record<DriverService, { color: string; label: string; iconPath: string }> = {
  vuelta_segura: {
    color: '#22c55e', // verde
    label: 'Remis',
    iconPath: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
  },
  fletes: {
    color: '#3b82f6', // azul
    label: 'Flete',
    iconPath: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  },
  cadete: {
    color: '#f59e0b', // amarillo/naranja
    label: 'Cadete',
    iconPath: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z',
  },
  chofer: {
    color: '#8b5cf6', // violeta
    label: 'Chofer',
    iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  },
};

// Obtener el servicio principal del conductor
const getPrimaryService = (services: DriverService[] | null | undefined): DriverService => {
  if (!services || services.length === 0) return 'vuelta_segura';
  // Prioridad: fletes > cadete > chofer > vuelta_segura
  const priority: DriverService[] = ['fletes', 'cadete', 'chofer', 'vuelta_segura'];
  for (const service of priority) {
    if (services.includes(service)) return service;
  }
  return services[0];
};

// Crear ícono del marcador
const createMarkerIcon = (service: DriverService, isAvailable: boolean): google.maps.Symbol => {
  const config = serviceConfig[service];
  const color = isAvailable ? config.color : '#9ca3af';

  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
    scale: 12,
  };
};

// Ícono del servicio para el InfoWindow
const ServiceIcon: React.FC<{ service: DriverService }> = ({ service }) => {
  const iconProps = { className: 'w-4 h-4' };
  switch (service) {
    case 'fletes': return <Truck {...iconProps} />;
    case 'cadete': return <Bike {...iconProps} />;
    case 'chofer': return <User {...iconProps} />;
    default: return <Car {...iconProps} />;
  }
};

const DriverMarker: React.FC<DriverMarkerProps> = ({
  driver,
  isSelected,
  onSelect
}) => {
  // Saltar si no hay coordenadas válidas
  if (!driver.current_latitude || !driver.current_longitude) {
    return null;
  }

  const position = {
    lat: driver.current_latitude,
    lng: driver.current_longitude,
  };

  const isAvailable = driver.is_available;
  const services = driver.driver?.selected_services;
  const primaryService = getPrimaryService(services);
  const config = serviceConfig[primaryService];

  return (
    <>
      <Marker
        position={position}
        icon={createMarkerIcon(primaryService, isAvailable)}
        onClick={() => onSelect(driver.driver_id)}
        title={`${driver.driver?.nombre || 'Conductor'} - ${config.label}`}
      />

      {isSelected && (
        <InfoWindow
          position={position}
          onCloseClick={() => onSelect(null)}
        >
          <div className="p-2 min-w-[220px]">
            {/* Nombre del conductor */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: config.color }}
              >
                <ServiceIcon service={primaryService} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {driver.driver?.nombre} {driver.driver?.apellido}
                </h3>
                <span className="text-xs text-gray-500">{config.label}</span>
              </div>
            </div>

            {/* Estado */}
            <div className="mb-3">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                isAvailable
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isAvailable ? 'Disponible' : 'No disponible'}
              </span>
            </div>

            {/* Servicios */}
            {services && services.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Servicios:</p>
                <div className="flex flex-wrap gap-1">
                  {services.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs rounded"
                      style={{
                        backgroundColor: serviceConfig[s].color + '20',
                        color: serviceConfig[s].color
                      }}
                    >
                      {serviceConfig[s].label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Teléfono */}
            {driver.driver?.telefono_numero && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                <span>{driver.driver.telefono_numero}</span>
              </div>
            )}

            {/* Última actualización */}
            {driver.last_location_update && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Navigation className="w-4 h-4" />
                <span>Actualizado: {new Date(driver.last_location_update).toLocaleTimeString('es-AR')}</span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default DriverMarker;
