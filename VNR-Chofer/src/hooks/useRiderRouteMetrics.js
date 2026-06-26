import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import mapsService from '../services/maps.service';
import { extractPickupCoordinate } from '../utils/mapCoordinates';

/** Distancia, polyline y ETA para mapa en ruta del patrón. */
export const useRiderRouteMetrics = (auxilio) => {
  const [userCoords, setUserCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);

  const dest = extractPickupCoordinate(auxilio?.pickup, null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        const origin = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        if (cancelled) return;
        setUserCoords(origin);

        if (!dest) return;

        const route = await mapsService.getRouteWithPolyline(origin, dest).catch(() => null);
        if (cancelled) return;

        if (route?.polylinePoints?.length) {
          setRouteCoordinates(route.polylinePoints);
          setDistanceKm(
            route.distance != null
              ? Number((route.distance / 1000).toFixed(1))
              : Number(mapsService.calculateDistance(origin, dest).toFixed(1))
          );
        } else {
          setRouteCoordinates([origin, dest]);
          setDistanceKm(Number(mapsService.calculateDistance(origin, dest).toFixed(1)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auxilio?.pickup?.coordinates?.lat, auxilio?.pickup?.coordinates?.lng]);

  return { userCoords, distanceKm, routeCoordinates, loading, dest };
};
