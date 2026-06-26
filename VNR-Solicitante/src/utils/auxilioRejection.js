export const OPERATOR_CONTACT = {
  phone: '+54 9 11 4823 5500',
  phoneDial: '+5491148235500',
};

export const DEFAULT_ASSIGNMENT_FAILURE_REASON =
  'Sin tripulación disponible en el ámbito geográfico solicitado.';

const REASON_LABELS = {
  no_drivers_available: DEFAULT_ASSIGNMENT_FAILURE_REASON,
  no_crew_available: DEFAULT_ASSIGNMENT_FAILURE_REASON,
  sin_tripulacion: DEFAULT_ASSIGNMENT_FAILURE_REASON,
  'Sin tripulación disponible en el ámbito geográfico solicitado.':
    DEFAULT_ASSIGNMENT_FAILURE_REASON,
};

export const resolveAuxilioRejectionReason = (auxilio, overrideReason) => {
  if (overrideReason?.trim()) return overrideReason.trim();

  const raw =
    auxilio?.rejectionReason ||
    auxilio?.cancellationReason ||
    auxilio?.ride?.cancellationReason;

  if (!raw) return DEFAULT_ASSIGNMENT_FAILURE_REASON;
  if (REASON_LABELS[raw]) return REASON_LABELS[raw];
  if (typeof raw === 'string' && raw.length > 3 && !/^[a-z_]+$/.test(raw)) return raw;

  return DEFAULT_ASSIGNMENT_FAILURE_REASON;
};

/** Pedido no asignado por falta de tripulación u operador (no cancelación del usuario). */
export const isAuxilioAssignmentFailure = (auxilio) => {
  if (!auxilio) return false;

  if (auxilio.status === 'rechazado' || auxilio.rawStatus === 'rejected') {
    return true;
  }

  if (auxilio.status === 'cancelado' || auxilio.rawStatus === 'cancelled') {
    const reason = auxilio.cancellationReason;
    return reason === 'no_drivers_available' || reason === 'no_crew_available';
  }

  return false;
};
