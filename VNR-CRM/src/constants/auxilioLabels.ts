/** Etiquetas en español para auxilios náuticos (CRM) */

export const EMERGENCY_TYPE_LABELS: Record<string, string> = {
  via_agua: 'Vía de agua',
  salud: 'Emergencia de salud',
  mecanica: 'Asistencia mecánica',
  mecánica: 'Asistencia mecánica',
  otro: 'Otro',
  amarrado_fondeado: 'Amarrado / fondeado',
  al_garete: 'Al garete',
  varado: 'Varado',
};

export const RIVER_STATUS_LABELS: Record<string, string> = {
  solicitado: 'Solicitado',
  buscando: 'Buscando patrón',
  asignado: 'Patrón asignado',
  arribado: 'Patrón arribado',
  zarpado: 'Zarpado',
  en_proceso: 'En proceso',
  regreso: 'Regreso a base',
  finalizado: 'Finalizado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

export const DB_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente de asignación',
  accepted: 'Patrón asignado',
  en_route: 'Patrón en camino',
  arrived: 'Patrón arribado',
  in_progress: 'En servicio',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
  no_drivers: 'Sin patrones disponibles',
};

export const TIMELINE_EVENT_LABELS: Record<string, string> = {
  accepted: 'Patrón aceptó el auxilio',
  assigned: 'Asignado por operador',
  arribado: 'Patrón arribó al lugar',
  zarpado: 'Zarpó hacia el auxilio',
  en_proceso: 'Servicio en curso',
  regreso: 'Regreso a base operativa',
  finalizado: 'Auxilio finalizado',
};

export const PHOTO_PHASE_LABELS: Record<string, string> = {
  before: 'Antes del servicio',
  during: 'Durante el servicio',
  after: 'Después del servicio',
};

const ACTIVE_DB = new Set(['pending', 'accepted', 'en_route', 'arrived', 'in_progress']);
const ACTIVE_RIVER = new Set([
  'solicitado',
  'buscando',
  'asignado',
  'arribado',
  'zarpado',
  'en_proceso',
  'regreso',
]);
const DONE = new Set(['completed', 'finalizado']);
const CANCELLED = new Set(['cancelled', 'cancelado', 'rechazado', 'no_drivers']);

export type AuxilioLifecycle = 'active' | 'done' | 'cancelled' | 'pending';

export function getEmergencyTypeLabel(type?: string | null) {
  if (!type) return '—';
  return EMERGENCY_TYPE_LABELS[type] || type.replace(/_/g, ' ');
}

export function getAuxilioStatusLabel(riverStatus?: string | null, dbStatus?: string | null) {
  if (riverStatus && RIVER_STATUS_LABELS[riverStatus]) return RIVER_STATUS_LABELS[riverStatus];
  if (dbStatus && DB_STATUS_LABELS[dbStatus]) return DB_STATUS_LABELS[dbStatus];
  return riverStatus || dbStatus || '—';
}

export function getAuxilioLifecycle(riverStatus?: string | null, dbStatus?: string | null): AuxilioLifecycle {
  const rs = riverStatus || '';
  const ds = dbStatus || '';
  if (CANCELLED.has(rs) || CANCELLED.has(ds)) return 'cancelled';
  if (DONE.has(rs) || DONE.has(ds)) return 'done';
  if (ACTIVE_RIVER.has(rs) || ACTIVE_DB.has(ds)) return 'active';
  if (ds === 'pending' || rs === 'solicitado') return 'pending';
  return 'active';
}

export function getLifecycleLabel(lifecycle: AuxilioLifecycle) {
  switch (lifecycle) {
    case 'active':
      return 'Auxilio activo';
    case 'pending':
      return 'En cola';
    case 'done':
      return 'Finalizado';
    case 'cancelled':
      return 'Cancelado';
  }
}

export function getPriorityLabel(priority?: number | null, override?: number | null) {
  const value = override ?? priority;
  if (value == null) return '—';
  if (value === 0) return 'Urgente';
  if (value === 1) return 'Alta';
  if (value === 2) return 'Normal';
  return String(value);
}

export function isDangerEmergency(type?: string | null) {
  return type === 'via_agua' || type === 'salud' || type === 'varado';
}
