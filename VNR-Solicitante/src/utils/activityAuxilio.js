import { EMERGENCY_TYPES, COLORS } from '../constants/theme';
import { getEmergencyLabel, isDangerEmergency, isTerminalAuxilioStatus } from './auxilioLive';

const SHORT_EMERGENCY_LABELS = {
  amarrado_fondeado: 'Amarrado',
  al_garete: 'Al garete',
  via_agua: 'Vía de agua',
  varado: 'Varado',
  salud: 'Emergencia de salud',
};

export const getEmergencyShortLabel = (emergencyType) =>
  SHORT_EMERGENCY_LABELS[emergencyType] || getEmergencyLabel(emergencyType);

export const getEmergencyTypeMeta = (emergencyType) =>
  EMERGENCY_TYPES.find((e) => e.id === emergencyType) || {
    id: emergencyType,
    label: getEmergencyShortLabel(emergencyType),
    icon: 'help-circle-outline',
    iconFamily: 'ionicons',
    danger: isDangerEmergency(emergencyType),
  };

export const formatActivityListDate = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
};

export const formatActivityDetailDate = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
};

export const extractActivityLocation = (auxilio) => {
  const address = auxilio?.pickup?.address || '';
  if (!address) return 'Ubicación del auxilio';

  const withoutCoords = address
    .split('·')
    .map((part) => part.trim())
    .find((part) => part && !/^Lat\s/i.test(part));

  if (withoutCoords) {
    return withoutCoords.split(',')[0].trim();
  }

  return address.split('·')[0]?.trim() || 'Ubicación del auxilio';
};

export const getActivityStatusBadge = (status) => {
  if (status === 'finalizado') {
    return { label: 'Completado', tone: 'completed' };
  }
  if (['cancelado', 'rechazado'].includes(status)) {
    return { label: 'Cancelado', tone: 'cancelled' };
  }
  return { label: 'En curso', tone: 'active' };
};

export const isHistorialAuxilio = (auxilio) => isTerminalAuxilioStatus(auxilio?.status);

export const buildServiceReason = (auxilio) => {
  const failures = auxilio?.failureTypes || [];
  const emergencyMeta = getEmergencyTypeMeta(auxilio?.emergencyType);
  const title =
    failures.length > 0
      ? failures.join(' + ')
      : getEmergencyShortLabel(auxilio?.emergencyType);

  const description =
    emergencyMeta.subtitle ||
    (auxilio?.emergencyType === 'via_agua'
      ? 'Vía de agua reportada a bordo. Se realizó asistencia y remolque según protocolo.'
      : 'Auxilio náutico registrado y atendido por la tripulación asignada.');

  return { title, description };
};

export const PHOTO_PHASES = [
  { key: 'previa', altKey: 'before', label: 'Previa al remolque' },
  { key: 'durante', altKey: 'during', label: 'Durante el remolque' },
  { key: 'post', altKey: 'after', label: 'Post - a salvo' },
];

export const resolveAuxilioPhoto = (photos, phase) => {
  if (!photos) return null;
  return photos[phase.key] || photos[phase.altKey] || null;
};

export const ACTIVITY_ICON_COLORS = {
  danger: COLORS.error,
  default: COLORS.text,
  dangerBorder: 'rgba(248, 113, 113, 0.55)',
  defaultBorder: COLORS.border,
};
