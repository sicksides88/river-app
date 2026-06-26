/**
 * Helpers para leer/escribir metadata en rides.notes (JSON).
 */

export const parseRideNotes = (notes) => {
  if (!notes) return {};
  if (typeof notes === 'object') return { ...notes };
  try {
    return JSON.parse(notes);
  } catch {
    return notes ? { rawNotes: notes } : {};
  }
};

export const stringifyRideNotes = (meta) => JSON.stringify(meta || {});

export const mergeRideNotes = (notes, patch) => {
  const meta = parseRideNotes(notes);
  return stringifyRideNotes({ ...meta, ...patch });
};

export const setEtaMinutes = (notes, etaMinutes) => {
  const eta = Number(etaMinutes);
  if (!Number.isFinite(eta) || eta < 1) return notes;
  const meta = parseRideNotes(notes);
  meta.etaMinutes = Math.round(eta);
  meta.etaUpdatedAt = new Date().toISOString();
  return stringifyRideNotes(meta);
};

export const appendTimelineEvent = (notes, event, extra = {}) => {
  const meta = parseRideNotes(notes);
  if (!Array.isArray(meta.timeline)) meta.timeline = [];
  meta.timeline.push({
    event,
    at: new Date().toISOString(),
    ...extra,
  });
  return stringifyRideNotes(meta);
};

/** Mapea estados náuticos River a columnas legacy de rides. */
export const mapRiverStatusToDb = (status) => {
  const map = {
    arribado: 'arrived',
    zarpado: 'in_progress',
    en_proceso: 'in_progress',
    finalizado: 'completed',
    // legacy
    arrived: 'arrived',
    in_progress: 'in_progress',
    completed: 'completed',
  };
  return map[status] || status;
};

export const mapDbStatusToRiver = (dbStatus, notes) => {
  const meta = parseRideNotes(notes);
  const lastTimeline = Array.isArray(meta.timeline)
    ? meta.timeline[meta.timeline.length - 1]?.event
    : null;
  if (lastTimeline === 'zarpado') return 'zarpado';
  if (lastTimeline === 'arribado') return 'arribado';
  if (lastTimeline === 'regreso' || lastTimeline === 'finalizado') return 'finalizado';

  const map = {
    pending: 'solicitado',
    accepted: 'asignado',
    arrived: 'arribado',
    in_progress: meta.timeline?.some((t) => t.event === 'zarpado') ? 'zarpado' : 'en_proceso',
    completed: 'finalizado',
    cancelled: 'cancelado',
  };
  return map[dbStatus] || dbStatus;
};

/**
 * Persiste el motivo de cancelación en notes (JSON) cuando la columna
 * cancellation_reason no existe en el esquema de Supabase.
 */
export const appendCancellationToNotes = (notes, reason) => {
  const meta = parseRideNotes(notes);
  meta.cancellationReason = reason;
  meta.cancelledAt = new Date().toISOString();
  return stringifyRideNotes(meta);
};

export const readCancellationReason = (ride) => {
  if (ride?.cancellation_reason) return ride.cancellation_reason;
  if (!ride?.notes) return null;
  const meta = parseRideNotes(ride.notes);
  return meta.cancellationReason || null;
};
