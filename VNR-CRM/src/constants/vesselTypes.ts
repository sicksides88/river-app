/** Mismos tipos que la app móvil (VNR-Solicitante/src/utils/vesselForm.js) */
export const VESSEL_TYPE_OPTIONS = [
  {
    id: 'Motor',
    label: 'Motor',
    description: 'Embarcación a motor: lancha, semirrígido, crucero, etc.',
  },
  {
    id: 'Vela',
    label: 'Vela',
    description: 'Embarcación impulsada principalmente por velas.',
  },
  {
    id: 'Jetsky',
    label: 'Jetsky',
    description: 'Moto de agua o embarcación personal (PWC).',
  },
  {
    id: 'Remo',
    label: 'Remo',
    description: 'Kayak, bote a remo, canoa u otra embarcación sin motor.',
  },
] as const;

export type VesselTypeId = (typeof VESSEL_TYPE_OPTIONS)[number]['id'];

export const VESSEL_TYPE_IDS = VESSEL_TYPE_OPTIONS.map((o) => o.id);

export const getVesselTypeLabel = (id?: string | null) =>
  VESSEL_TYPE_OPTIONS.find((o) => o.id === id)?.label || id || '—';

export default VESSEL_TYPE_OPTIONS;
