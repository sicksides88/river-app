/**
 * Distancia Haversine entre dos coordenadas (km).
 * Preparado para reemplazar por PostGIS en Fase 3.
 */
export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Prioridad de emergencia para cola de auxilio (menor = más urgente). */
export const getEmergencyPriority = (notesJson) => {
  let meta = {};
  try {
    meta = notesJson ? JSON.parse(notesJson) : {};
  } catch {
    meta = {};
  }
  const type = meta.emergencyType || meta.emergency_type;
  if (type === 'via_agua' || type === 'salud') return 0;
  if (type === 'mecanica' || type === 'mecánica') return 1;
  return 2;
};
