import type { DriverAvailability, Profile } from './database';

export interface DriverMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  driver: DriverAvailability & {
    driver?: Profile;
  };
}

export interface MapConfig {
  center: google.maps.LatLngLiteral;
  zoom: number;
}

// Buenos Aires, Argentina - coordenadas por defecto
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: { lat: -34.6037, lng: -58.3816 },
  zoom: 12,
};

export type DriverMapStatus = 'online' | 'busy';

export const MARKER_COLORS: Record<DriverMapStatus, string> = {
  online: '#22c55e',  // green-500 - disponible
  busy: '#f97316',    // orange-500 - ocupado
};
