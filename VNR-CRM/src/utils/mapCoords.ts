import { AdminAuxilio } from '../services/auxilioAdmin.service';

export function parseCoord(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getAuxilioPickupCoords(auxilio: AdminAuxilio) {
  const lat = parseCoord(auxilio.pickup?.coordinates?.lat);
  const lng = parseCoord(auxilio.pickup?.coordinates?.lng);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function getDriverCoords(auxilio: AdminAuxilio) {
  const lat = parseCoord(auxilio.driverLocation?.lat);
  const lng = parseCoord(auxilio.driverLocation?.lng);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function fitMapToPoints(map: google.maps.Map, points: Array<{ lat: number; lng: number }>) {
  if (!points.length) return;
  if (points.length === 1) {
    map.setCenter(points[0]);
    map.setZoom(13);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  points.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, 48);
}
