import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface TrackingMapProps {
  driverLocation?: { lat: number; lng: number } | null;
  pickupLocation?: { lat: number; lng: number } | null;
  dropoffLocation?: { lat: number; lng: number } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: -31.4201, lng: -64.1888 }; // Córdoba, Argentina

const TrackingMap: React.FC<TrackingMapProps> = ({ driverLocation, pickupLocation, dropoffLocation }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-xl">
        <p className="text-gray-400">Cargando mapa...</p>
      </div>
    );
  }

  const center = driverLocation || pickupLocation || dropoffLocation || defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {driverLocation && (
        <Marker
          position={driverLocation}
          label={{ text: 'C', color: 'white', fontWeight: 'bold' }}
        />
      )}
      {pickupLocation && (
        <Marker
          position={pickupLocation}
          label={{ text: 'A', color: 'white', fontWeight: 'bold' }}
        />
      )}
      {dropoffLocation && (
        <Marker
          position={dropoffLocation}
          label={{ text: 'B', color: 'white', fontWeight: 'bold' }}
        />
      )}
    </GoogleMap>
  );
};

export default TrackingMap;
