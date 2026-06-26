/** Auxilio demo para recorrer el flujo UI manualmente (sin backend). */
export const DEMO_AUXILIO_ID = 'demo-rs-4921';

export const createDemoAuxilio = (coords = { latitude: -34.6037, longitude: -58.3816 }) => ({
  id: DEMO_AUXILIO_ID,
  simulation: true,
  status: 'buscando',
  emergencyType: 'via_agua',
  vesselName: 'El Resplandor',
  vessel: {
    id: 'demo-vessel-1',
    name: 'El Resplandor',
    registration: 'REY-4928',
  },
  vesselId: 'demo-vessel-1',
  failureTypes: ['Motor', 'Vía de agua'],
  etaMinutes: 12,
  solicitante: {
    nombre: 'Martín',
    apellido: 'Reyes',
    name: 'Martín Reyes',
    telefono_numero: '+54 341 555 0101',
  },
  user: {
    nombre: 'Martín',
    apellido: 'Reyes',
    name: 'Martín Reyes',
    telefono_numero: '+54 341 555 0101',
  },
  pickup: {
    address: 'Río Paraná · Frente Club Náutico Rosario',
    coordinates: {
      lat: coords.latitude + 0.02,
      lng: coords.longitude + 0.015,
    },
  },
  departureBase: 'Base Rosario',
  photos: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const isSimulationAuxilio = (auxilio) =>
  !!auxilio?.simulation || String(auxilio?.id || '').startsWith('demo-');

export const advanceSimulationStatus = (auxilio, status, extra = {}) => {
  const patch = {
    ...auxilio,
    simulation: true,
    status: status || auxilio?.status,
    updatedAt: new Date().toISOString(),
    ...extra,
  };
  if (status === 'en_proceso') {
    patch.procesoStartedAt = new Date().toISOString();
  }
  return patch;
};
