import { formatDurationLabel, getStatusBadgeLabel } from './auxilioLive';

export const SIMULATION_STEP_MS = 7000;

export const DEMO_PATRON = {
  id: 'demo-patron-1',
  name: 'Carlos Mendoza',
  phone: '+54 341 555 0101',
  vesselName: 'Lancha auxilio',
  registration: 'LRI-2210',
  rating: 4.9,
};

const nowIso = () => new Date().toISOString();

const minutesAgoIso = (mins) => new Date(Date.now() - mins * 60000).toISOString();

/** Pasos del auto-play demo (orden Figma). */
export const SIMULATION_STEPS = [
  {
    status: 'solicitado',
    etaMinutes: null,
    driver: null,
  },
  {
    status: 'asignado',
    etaMinutes: 15,
    driver: DEMO_PATRON,
    assignedAt: minutesAgoIso(2),
  },
  {
    status: 'zarpado',
    etaMinutes: 8,
    driver: DEMO_PATRON,
    assignedAt: minutesAgoIso(5),
  },
  {
    status: 'arribado',
    etaMinutes: null,
    driver: DEMO_PATRON,
    assignedAt: minutesAgoIso(12),
    arrivedAt: minutesAgoIso(1),
  },
  {
    status: 'en_proceso',
    etaMinutes: null,
    driver: DEMO_PATRON,
    assignedAt: minutesAgoIso(15),
    arrivedAt: minutesAgoIso(8),
    startedAt: minutesAgoIso(7),
  },
  {
    status: 'finalizado',
    etaMinutes: null,
    driver: DEMO_PATRON,
    assignedAt: minutesAgoIso(45),
    arrivedAt: minutesAgoIso(38),
    startedAt: minutesAgoIso(37),
    completedAt: nowIso(),
    durationMinutes: 42,
    durationLabel: formatDurationLabel(42),
  },
];

export const getSimulationStepLabel = (stepIndex) => {
  const step = SIMULATION_STEPS[stepIndex];
  if (!step) return '';
  return getStatusBadgeLabel(step.status);
};

/** Offset en grados ~km visible en el mapa; converge al pickup según paso. */
const DRIVER_OFFSETS = [
  null,
  { lat: 0.018, lng: 0.012 },
  { lat: 0.008, lng: 0.005 },
  { lat: 0.002, lng: 0.001 },
  null,
  null,
];

export const getMockDriverLocation = (pickup, stepIndex) => {
  const lat = pickup?.coordinates?.lat;
  const lng = pickup?.coordinates?.lng;
  if (lat == null || lng == null) return null;

  const offset = DRIVER_OFFSETS[stepIndex];
  if (!offset) return null;

  return {
    latitude: lat + offset.lat,
    longitude: lng + offset.lng,
    heading: 180,
  };
};

export const buildSimulatedAuxilio = (baseAuxilio, stepIndex) => {
  if (!baseAuxilio) return null;

  const step = SIMULATION_STEPS[stepIndex] ?? SIMULATION_STEPS[SIMULATION_STEPS.length - 1];

  return {
    ...baseAuxilio,
    ...step,
    rawStatus: step.status,
    isSimulated: true,
  };
};

export const isSimulationComplete = (stepIndex) =>
  stepIndex >= SIMULATION_STEPS.length - 1;
