/** Utilidades de visualización de embarcaciones (app patrón) */

export const formatVesselSubtitle = (vessel) => {
  if (!vessel) return '';
  const typePart = [vessel.type, vessel.length_m ? `${vessel.length_m}'` : null]
    .filter(Boolean)
    .join(' ');
  return [vessel.registration, typePart, vessel.geographic_area || vessel.base_location]
    .filter(Boolean)
    .join(' · ');
};

export const getVesselFromAuxilio = (auxilio) => {
  if (!auxilio) return null;
  if (auxilio.vessel?.name || auxilio.vessel?.registration) return auxilio.vessel;
  if (auxilio.vesselName || auxilio.vesselId) {
    return { id: auxilio.vesselId, name: auxilio.vesselName };
  }
  return null;
};

export const getVesselDetailRows = (vessel) => {
  if (!vessel) return [];
  return [
    ['Matrícula', vessel.registration],
    ['Tipo', vessel.type],
    ['Eslora', vessel.length_m != null ? `${vessel.length_m} m` : null],
    ['Manga', vessel.beam_m != null ? `${vessel.beam_m} m` : null],
    ['Calado', vessel.draft_m != null ? `${vessel.draft_m} m` : null],
    ['Motores', vessel.engines],
    ['Color', vessel.color],
    ['Ámbito', vessel.geographic_area],
  ].filter(([, value]) => value != null && String(value).trim() !== '');
};
