import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import { fitMapToPoints } from '../../utils/mapCoords';
import { Loader2 } from 'lucide-react';
import useNativeMapMarkers, { NativeMarkerSpec } from './useNativeMapMarkers';

type RiverMapProps = {
  height?: string;
  center: { lat: number; lng: number };
  markers: NativeMarkerSpec[];
  onMapReady?: (map: google.maps.Map) => void;
  className?: string;
};

const RiverMap: React.FC<RiverMapProps> = ({
  height = '320px',
  center,
  markers,
  onMapReady,
  className = '',
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const points = useMemo(
    () => markers.map((m) => m.position),
    [markers]
  );

  const onLoad = useCallback(
    (instance: google.maps.Map) => {
      setMap(instance);
      if (points.length) fitMapToPoints(instance, points);
      else {
        instance.setCenter(center);
        instance.setZoom(13);
      }
      onMapReady?.(instance);
    },
    [center, points, onMapReady]
  );

  useNativeMapMarkers(map, markers, isLoaded && !!map);

  useEffect(() => {
    if (!map) return;
    if (points.length) fitMapToPoints(map, points);
  }, [map, points]);

  if (loadError) {
    return <p className="text-sm text-red-600">No se pudo cargar el mapa.</p>;
  }

  if (!isLoaded) {
    return (
      <div
        className="flex justify-center items-center bg-gray-50 rounded-xl border border-gray-200"
        style={{ height }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        onLoad={onLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      />
    </div>
  );
};

export default RiverMap;
