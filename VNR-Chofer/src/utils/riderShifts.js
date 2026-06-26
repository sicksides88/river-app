import { formatShiftRange } from './riderDisplay';
import { toDateKey } from './riderAvailability';

const isSameDay = (a, b) => toDateKey(a) === toDateKey(b);

const isTomorrow = (date) => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return isSameDay(date, t);
};

const formatCardDate = (date) =>
  date
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    .replace('.', '')
    .toUpperCase();

const formatCardLabel = (date, now = new Date()) => {
  if (isSameDay(date, now)) return 'HOY';
  if (isTomorrow(date)) return 'MAÑANA';
  return date
    .toLocaleDateString('es-AR', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3)
    .toUpperCase();
};

export const mapPatrolShiftToCard = (raw, now = new Date()) => {
  const start = new Date(raw.starts_at);
  const end = new Date(raw.ends_at);
  const inWindow = start <= now && end >= now;

  let status = 'scheduled';
  if (inWindow && raw.status === 'active') status = 'en_curso';
  else if (inWindow && raw.status === 'scheduled') status = 'en_curso';
  else if (start > now && raw.status === 'scheduled') status = 'proximo';
  else if (raw.status === 'pending_confirmation' || raw.confirmation_status === 'pending') {
    status = 'pending_rs';
  }

  return {
    id: raw.id,
    label: formatCardLabel(start, now),
    date: formatCardDate(start),
    base: raw.base?.name || 'Base',
    time: formatShiftRange(raw.starts_at, raw.ends_at),
    boat: raw.unit_label || raw.vehicle_registration || raw.boat || '—',
    status,
    assignedByRs: status === 'pending_rs',
    raw,
  };
};

export const mapPatrolShiftsToCards = (shifts = []) =>
  shifts.map((s) => mapPatrolShiftToCard(s)).sort((a, b) => new Date(a.raw.starts_at) - new Date(b.raw.starts_at));
