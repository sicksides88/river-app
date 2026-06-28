import { useEffect, useRef } from 'react';

export type NativeMarkerSpec = {
  id: string;
  position: { lat: number; lng: number };
  color: string;
  title: string;
  zIndex?: number;
  onClick?: () => void;
};

function buildDotIcon(color: string, scale = 14): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
  };
}

/** Marcadores nativos de Google Maps — más fiables que el componente React Marker */
export function useNativeMapMarkers(
  map: google.maps.Map | null,
  markers: NativeMarkerSpec[],
  enabled = true
) {
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!enabled || !map || !markers.length) return;
    if (typeof google === 'undefined' || !google.maps) return;

    markersRef.current = markers.map((spec) => {
      const marker = new google.maps.Marker({
        map,
        position: spec.position,
        title: spec.title,
        icon: buildDotIcon(spec.color),
        zIndex: spec.zIndex ?? 1,
        optimized: true,
      });
      if (spec.onClick) {
        marker.addListener('click', spec.onClick);
      }
      return marker;
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, markers, enabled]);
}

export default useNativeMapMarkers;
