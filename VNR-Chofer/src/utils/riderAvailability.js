/** Disponibilidad semanal / puntual del patrón (River Service). */

import CONFIG from '../constants/config';

export const RIDER_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const RIDER_DAY_NAMES = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const getRiderDefaultWeeklySchedule = () => [
  { day_of_week: 0, is_available: false, time_ranges: [] },
  { day_of_week: 1, is_available: true, time_ranges: [{ id: 'mon', start_time: '08:00', end_time: '16:00' }] },
  { day_of_week: 2, is_available: true, time_ranges: [{ id: 'tue', start_time: '08:00', end_time: '16:00' }] },
  { day_of_week: 3, is_available: true, time_ranges: [{ id: 'wed', start_time: '08:00', end_time: '16:00' }] },
  { day_of_week: 4, is_available: true, time_ranges: [{ id: 'thu', start_time: '08:00', end_time: '16:00' }] },
  { day_of_week: 5, is_available: true, time_ranges: [{ id: 'fri', start_time: '08:00', end_time: '20:00' }] },
  { day_of_week: 6, is_available: true, time_ranges: [{ id: 'sat', start_time: '08:00', end_time: '14:00' }] },
];

const pad = (n) => String(n).padStart(2, '0');

export const toDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

export const isMinutesInRange = (minutes, startTime, endTime) => {
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  if (start == null || end == null) return false;
  if (end <= start) return minutes >= start || minutes < end;
  return minutes >= start && minutes < end;
};

export const formatTimeRangesLabel = (day) => {
  if (!day?.is_available || !day.time_ranges?.length) return 'No disponible';
  return day.time_ranges
    .map((r) => `${r.start_time}–${r.end_time}`)
    .join(' · ');
};

const dateInRange = (dateKey, startDate, endDate) => {
  const end = endDate || startDate;
  return dateKey >= startDate && dateKey <= end;
};

const getCustomDateType = (customDate) => {
  if (customDate?.availability_type === 'block' || customDate?.availability_type === 'extra') {
    return customDate.availability_type;
  }
  return customDate?.time_ranges?.length ? 'extra' : 'block';
};

export const normalizeWeeklySchedule = (weekly = []) => {
  const defaults = getRiderDefaultWeeklySchedule();
  if (!Array.isArray(weekly) || weekly.length !== 7) return defaults;
  return defaults.map((fallback) => {
    const found = weekly.find((d) => d.day_of_week === fallback.day_of_week);
    if (!found) return fallback;
    return {
      day_of_week: found.day_of_week,
      is_available: !!found.is_available,
      time_ranges: Array.isArray(found.time_ranges) ? found.time_ranges : [],
    };
  });
};

export const hasAvailabilityConfigured = (schedule) => {
  const effective = schedule || { weekly_schedule: getRiderDefaultWeeklySchedule(), custom_dates: [] };
  const weekly = normalizeWeeklySchedule(effective.weekly_schedule);
  const hasWeekly = weekly.some((d) => d.is_available && d.time_ranges.length > 0);
  const hasExtra = (effective.custom_dates || []).some(
    (cd) => getCustomDateType(cd) === 'extra' && cd.time_ranges?.length > 0
  );
  return hasWeekly || hasExtra;
};

const withDefaultSchedule = (schedule) =>
  schedule?.weekly_schedule
    ? schedule
    : { weekly_schedule: getRiderDefaultWeeklySchedule(), custom_dates: schedule?.custom_dates || [] };

/** ¿El patrón puede activar EN GUARDIA ahora según su disponibilidad? */
export const isInGuardAvailabilityWindow = (schedule, at = new Date()) => {
  const effective = withDefaultSchedule(schedule);
  const weekly = normalizeWeeklySchedule(effective.weekly_schedule);
  const customDates = effective.custom_dates || [];
  const dateKey = toDateKey(at);
  const dayOfWeek = at.getDay();
  const nowMinutes = at.getHours() * 60 + at.getMinutes();

  const matchingCustom = customDates.filter((cd) =>
    dateInRange(dateKey, cd.start_date, cd.end_date || cd.start_date)
  );

  for (const cd of matchingCustom) {
    if (getCustomDateType(cd) === 'block') return false;
  }

  for (const cd of matchingCustom) {
    if (getCustomDateType(cd) === 'extra' && cd.time_ranges?.length) {
      if (cd.time_ranges.some((r) => isMinutesInRange(nowMinutes, r.start_time, r.end_time))) {
        return true;
      }
    }
  }

  const day = weekly.find((d) => d.day_of_week === dayOfWeek);
  if (!day?.is_available || !day.time_ranges?.length) return false;
  return day.time_ranges.some((r) => isMinutesInRange(nowMinutes, r.start_time, r.end_time));
};

export const getGuardBlockReason = (schedule, hasPatrolShift, at = new Date()) => {
  if (CONFIG.REQUIRE_PATROL_SHIFT_FOR_GUARD && !hasPatrolShift) {
    return 'no_patrol_shift';
  }
  if (!hasAvailabilityConfigured(schedule)) return 'no_schedule';
  if (CONFIG.REQUIRE_GUARD_AVAILABILITY_WINDOW && !isInGuardAvailabilityWindow(schedule, at)) {
    return 'outside_window';
  }
  return null;
};

/**
 * ¿Puede activar EN GUARDIA?
 * MVP: solo ventana de disponibilidad (CONFIG.REQUIRE_PATROL_SHIFT_FOR_GUARD = false).
 * Prod: también turno RS activo cuando REQUIRE_PATROL_SHIFT_FOR_GUARD = true.
 */
export const canActivateGuard = (schedule, hasPatrolShift, at = new Date()) => {
  if (!hasAvailabilityConfigured(schedule)) return false;
  if (CONFIG.REQUIRE_GUARD_AVAILABILITY_WINDOW && !isInGuardAvailabilityWindow(schedule, at)) {
    return false;
  }
  if (CONFIG.REQUIRE_PATROL_SHIFT_FOR_GUARD && !hasPatrolShift) return false;
  return true;
};

export const getActiveGuardWindowLabel = (schedule, at = new Date()) => {
  const effective = withDefaultSchedule(schedule);
  const weekly = normalizeWeeklySchedule(effective.weekly_schedule);
  const customDates = effective.custom_dates || [];
  const dateKey = toDateKey(at);
  const dayOfWeek = at.getDay();
  const nowMinutes = at.getHours() * 60 + at.getMinutes();

  for (const cd of customDates) {
    if (!dateInRange(dateKey, cd.start_date, cd.end_date || cd.start_date)) continue;
    if (getCustomDateType(cd) === 'extra' && cd.time_ranges?.length) {
      const active = cd.time_ranges.find((r) => isMinutesInRange(nowMinutes, r.start_time, r.end_time));
      if (active) return `${active.start_time} - ${active.end_time}`;
    }
  }

  const day = weekly.find((d) => d.day_of_week === dayOfWeek);
  if (!day?.is_available) return null;
  const active = day.time_ranges?.find((r) => isMinutesInRange(nowMinutes, r.start_time, r.end_time));
  return active ? `${active.start_time} - ${active.end_time}` : null;
};
