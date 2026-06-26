/**
 * Máquina de estados visual del servicio activo (patrón náutico).
 * Mapea UI Figma → estados backend existentes sin cambiar auxilioService.
 */
export const RIDER_FLOW_STEPS = {
  CONFIRM_START: 'confirm_start',
  EN_RUTA: 'en_ruta',
  FOTO_PRE: 'foto_pre',
  FOTO_DURING: 'foto_during',
  EN_PROCESO: 'en_proceso',
  CIERRE: 'cierre',
  FIRMA: 'firma',
  REGRESO: 'regreso',
  DONE: 'done',
};

export const tryParseNotes = (notes) => {
  try {
    return typeof notes === 'string' ? JSON.parse(notes) : notes || {};
  } catch {
    return {};
  }
};

export const getAuxilioMeta = (auxilio) => {
  if (!auxilio) return {};
  const fromRide = auxilio.ride?.notes ? tryParseNotes(auxilio.ride.notes) : {};
  return {
    ...fromRide,
    photos: { ...fromRide.photos, ...auxilio.photos },
    signature: auxilio.signature ?? fromRide.signature,
    returnCompleted: auxilio.returnCompleted ?? fromRide.returnCompleted,
    departureBase: auxilio.departureBase ?? fromRide.departureBase,
    serviceReason: auxilio.serviceReason ?? fromRide.serviceReason,
    timeline: fromRide.timeline || [],
  };
};

/** Timestamp de inicio del cronómetro (evento en_proceso en timeline). */
export const getProcesoStartedAt = (auxilio) => {
  const meta = getAuxilioMeta(auxilio);
  const event = meta.timeline?.find((t) => t.event === 'en_proceso' || t.status === 'en_proceso');
  if (event?.at) return event.at;
  if (auxilio?.procesoStartedAt) return auxilio.procesoStartedAt;
  if (auxilio?.status === 'en_proceso') return auxilio.updatedAt || auxilio.updated_at;
  return null;
};

export const resolveFlowStep = (auxilio, photos = {}, signature = null) => {
  if (!auxilio) return RIDER_FLOW_STEPS.CONFIRM_START;

  const status = auxilio.status;
  const meta = getAuxilioMeta(auxilio);
  const mergedPhotos = { ...meta.photos, ...photos };
  const hasSignature = signature || meta.signature;

  if (status === 'finalizado' || status === 'completed') return RIDER_FLOW_STEPS.DONE;
  if (meta.returnCompleted || status === 'regreso') return RIDER_FLOW_STEPS.DONE;

  if (hasSignature) {
    if (!meta.returnCompleted) return RIDER_FLOW_STEPS.REGRESO;
    return RIDER_FLOW_STEPS.DONE;
  }

  if (mergedPhotos.after && !hasSignature) return RIDER_FLOW_STEPS.FIRMA;
  if (mergedPhotos.during && !mergedPhotos.after) return RIDER_FLOW_STEPS.CIERRE;
  if (mergedPhotos.before && !mergedPhotos.during) return RIDER_FLOW_STEPS.FOTO_DURING;

  if (status === 'en_proceso') return RIDER_FLOW_STEPS.EN_PROCESO;

  if (status === 'arribado') {
    if (!mergedPhotos.before) return RIDER_FLOW_STEPS.FOTO_PRE;
    return RIDER_FLOW_STEPS.FOTO_DURING;
  }

  if (status === 'zarpado') return RIDER_FLOW_STEPS.EN_RUTA;

  if (status === 'asignado') return RIDER_FLOW_STEPS.CONFIRM_START;

  return RIDER_FLOW_STEPS.EN_RUTA;
};

export const buildDisplayId = (auxilio) => {
  if (auxilio?.displayId) return auxilio.displayId;
  const raw = String(auxilio?.id || '');
  const short = raw.replace(/-/g, '').slice(-4).toUpperCase() || '0000';
  return `#RS-${short}`;
};

export const getVesselDisplayLine = (auxilio) => {
  const name = auxilio?.vesselName || auxilio?.vessel?.name || 'Embarcación';
  const reg =
    auxilio?.vessel?.registration ||
    auxilio?.vessel?.matricula ||
    auxilio?.vesselRegistration ||
    auxilio?.vesselId?.slice?.(-8)?.toUpperCase();
  return reg ? `${name} · ${reg}` : name;
};
