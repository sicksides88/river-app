import { isSimulationAuxilio } from '../constants/demoAuxilio';

/** Estados que no deben mostrarse como auxilio en curso del patrón. */
export const TERMINAL_DRIVER_AUXILIO_STATUSES = new Set([
  'finalizado',
  'cancelado',
  'rechazado',
  'cancelled',
  'completed',
  'rejected',
  'solicitado',
  'buscando',
  'pending',
]);

const ACTIVE_RAW_STATUSES = new Set([
  'accepted',
  'driver-assigned',
  'driver_assigned',
  'confirmed',
  'arrived',
  'driver-arrived',
  'driver_arrived',
  'in_progress',
  'in-progress',
  'arribado',
  'zarpado',
  'en_proceso',
  'regreso',
]);

export const isActiveDriverAuxilio = (auxilio) => {
  if (!auxilio?.id) return false;
  if (isSimulationAuxilio(auxilio)) return false;

  const status = String(auxilio.status || '').toLowerCase();
  const rawStatus = String(auxilio.rawStatus || auxilio.ride?.status || '').toLowerCase();

  if (TERMINAL_DRIVER_AUXILIO_STATUSES.has(status)) return false;
  if (TERMINAL_DRIVER_AUXILIO_STATUSES.has(rawStatus)) return false;

  if (ACTIVE_RAW_STATUSES.has(rawStatus)) return true;

  const activeMapped = new Set([
    'asignado',
    'arribado',
    'zarpado',
    'en_proceso',
    'regreso',
  ]);
  return activeMapped.has(status);
};

export const pickActiveDriverAuxilio = (auxilios = []) =>
  auxilios.find(isActiveDriverAuxilio) || null;
