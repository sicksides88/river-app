const DEFAULT_COORD = { latitude: -34.6037, longitude: -58.3816 };

export const isValidLatLng = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln);
};

/** Devuelve { latitude, longitude } o null si no hay coords válidas. */
export const toMapCoordinate = (lat, lng) => {
  if (!isValidLatLng(lat, lng)) return null;
  return { latitude: Number(lat), longitude: Number(lng) };
};

/** Extrae coords de pickup en distintos formatos (ride, socket, auxilio). */
export const extractPickupCoordinate = (pickup, fallback = DEFAULT_COORD) => {
  if (!pickup) return fallback;
  const lat =
    pickup.coordinates?.lat ??
    pickup.coordinates?.latitude ??
    pickup.lat ??
    pickup.latitude;
  const lng =
    pickup.coordinates?.lng ??
    pickup.coordinates?.longitude ??
    pickup.lng ??
    pickup.longitude;
  return toMapCoordinate(lat, lng) || fallback;
};

export const toMapRegion = (lat, lng, deltas = { latitudeDelta: 0.06, longitudeDelta: 0.06 }) => {
  const coord = toMapCoordinate(lat, lng) || DEFAULT_COORD;
  return { ...coord, ...deltas };
};

export { DEFAULT_COORD };
