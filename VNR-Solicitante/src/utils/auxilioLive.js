import { AUXILIO_STATES, EMERGENCY_TYPES, COLORS } from '../constants/theme';

export const ACCENT = {
  blue: COLORS.info,
  orange: COLORS.accentOrange,
  red: COLORS.error,
};

export const getAuxilioDisplayId = (auxilio) => {
  if (auxilio?.displayId) return auxilio.displayId;
  const raw = String(auxilio?.id || '');
  const short = raw.replace(/-/g, '').slice(-4).toUpperCase() || '0000';
  return `#RS-${short}`;
};

export const getStatusBadgeLabel = (status) => {
  const map = {
    solicitado: 'SOLICITADO',
    buscando: 'BUSCANDO',
    asignado: 'ASIGNADO',
    zarpado: 'ZARPADO',
    arribado: 'ARRIBADO',
    en_proceso: 'EN PROCESO',
    finalizado: 'FINALIZADO',
    cancelado: 'CANCELADO',
    rechazado: 'RECHAZADO',
  };
  return map[status] || String(status || '').toUpperCase();
};

export const getStatusAccent = (status) => {
  if (['asignado', 'solicitado', 'buscando', 'finalizado'].includes(status)) return ACCENT.blue;
  if (['zarpado', 'arribado', 'en_proceso'].includes(status)) return ACCENT.orange;
  if (['cancelado', 'rechazado'].includes(status)) return ACCENT.red;
  return ACCENT.blue;
};

export const getEmergencyLabel = (emergencyType) =>
  EMERGENCY_TYPES.find((e) => e.id === emergencyType)?.label || emergencyType || '—';

export const isDangerEmergency = (emergencyType) =>
  ['via_agua', 'salud', 'varado'].includes(emergencyType);

export const formatMinutesAgo = (isoDate) => {
  if (!isoDate) return null;
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs} h`;
};

export const formatDurationLabel = (minutes) => {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

export const getPatronInitials = (driver) => {
  const name = driver?.name || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'PA';
};

export const getPatronVesselLine = (driver) => {
  const parts = [driver?.vesselName, driver?.registration].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if (driver?.vehicle) return typeof driver.vehicle === 'string' ? driver.vehicle : driver.vehicle?.model;
  return 'Embarcación de auxilio';
};

export const getTimelineSteps = (auxilio) => {
  const driverName = auxilio?.driver?.name;
  const eta = auxilio?.etaMinutes;
  const status = auxilio?.status;

  const steps = [
    {
      id: 'solicitado',
      label: 'Solicitado',
      subtitle: formatMinutesAgo(auxilio?.createdAt),
      state: 'pending',
    },
    {
      id: 'asignado',
      label: driverName ? `Asignado · ${driverName}` : 'Asignado',
      subtitle: eta ? `ETA ${eta} min` : formatMinutesAgo(auxilio?.assignedAt),
      state: 'pending',
    },
    {
      id: 'zarpado',
      label: 'Zarpado',
      subtitle: eta ? `ETA ${eta} min` : formatMinutesAgo(auxilio?.assignedAt),
      state: 'pending',
    },
    {
      id: 'arribo',
      label: 'Arribo',
      subtitle: formatMinutesAgo(auxilio?.arrivedAt),
      state: 'pending',
    },
    {
      id: 'en_proceso',
      label: 'En proceso',
      subtitle: null,
      state: 'pending',
    },
  ];

  const order = ['solicitado', 'buscando', 'asignado', 'zarpado', 'arribado', 'en_proceso', 'finalizado'];
  const idx = order.indexOf(status);

  if (idx >= 0) steps[0].state = idx === 0 ? 'active' : 'done';
  if (idx >= order.indexOf('asignado')) {
    steps[1].state = idx === order.indexOf('asignado') ? 'active' : 'done';
  }
  if (idx >= order.indexOf('zarpado')) {
    steps[2].state = idx === order.indexOf('zarpado') ? 'active' : 'done';
  }
  if (idx >= order.indexOf('arribado')) {
    steps[3].state = ['arribado', 'en_proceso'].includes(status) ? 'active' : 'done';
    if (idx >= order.indexOf('en_proceso')) steps[3].state = 'done';
  }
  if (idx >= order.indexOf('en_proceso')) {
    steps[4].state = status === 'en_proceso' ? 'active' : idx >= order.indexOf('finalizado') ? 'done' : 'pending';
  }
  if (status === 'finalizado') {
    steps.forEach((s) => { s.state = 'done'; });
  } else if (status === 'solicitado') {
    steps[0].state = 'active';
  } else if (status === 'buscando') {
    steps[0].state = 'done';
  }

  return steps;
};

export const AUXILIO_STATE_LABEL = (status) =>
  AUXILIO_STATES[status]?.label || status;

const TERMINAL_STATUSES = new Set([
  'finalizado',
  'cancelado',
  'rechazado',
  'cancelled',
  'completed',
  'rejected',
]);

export const isTerminalAuxilioStatus = (status) => TERMINAL_STATUSES.has(status);

export const isActiveAuxilioStatus = (status) => !isTerminalAuxilioStatus(status);
