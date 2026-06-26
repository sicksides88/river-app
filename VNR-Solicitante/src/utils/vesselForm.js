/** Tipos de embarcación (Pencil onboarding) */
export const VESSEL_TYPE_OPTIONS = [
  { id: 'Motor', label: 'Motor', icon: 'boat-outline' },
  { id: 'Vela', label: 'Vela', icon: 'navigate-circle-outline' },
  { id: 'Jetsky', label: 'Jetsky', icon: 'flash-outline' },
  { id: 'Remo', label: 'Remo', icon: 'fitness-outline' },
];

/** Matrícula: configurable (hoy 3 letras + guión + 4 números, ej. REY-4928) */
export const REGISTRATION_FORMAT = {
  letterCount: 3,
  digitCount: 4,
  separator: '-',
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRegistrationPattern = ({ letterCount, digitCount, separator }) =>
  new RegExp(
    `^[A-Z]{${letterCount}}${escapeRegex(separator)}[0-9]{${digitCount}}$`
  );

export const REGISTRATION_PATTERN = buildRegistrationPattern(REGISTRATION_FORMAT);

export const getRegistrationExample = () => {
  const { letterCount, digitCount, separator } = REGISTRATION_FORMAT;
  const sampleLetters = ('REY' + 'X'.repeat(letterCount)).slice(0, letterCount);
  const sampleDigits = ('4928' + '0'.repeat(digitCount)).slice(0, digitCount);
  return `${sampleLetters}${separator}${sampleDigits}`;
};

/** Subtítulo de embarcación: REY-4928 · Motor 28' · Rosario */
export const formatVesselSubtitle = (vessel) => {
  if (!vessel) return '';
  const typePart = [vessel.type, vessel.length_m ? `${vessel.length_m}'` : null]
    .filter(Boolean)
    .join(' ');
  return [vessel.registration, typePart, vessel.geographic_area || vessel.base_location]
    .filter(Boolean)
    .join(' · ');
};

export const getVesselTypeIcon = (type) =>
  VESSEL_TYPE_OPTIONS.find((o) => o.id === type)?.icon || 'boat-outline';

/** Línea de specs en listado de flota: REY-4928 · Motor · 8.5 m */
export const formatVesselSpecsLine = (vessel) => {
  if (!vessel) return '—';
  return [
    vessel.registration,
    vessel.type,
    vessel.length_m != null ? `${vessel.length_m} m` : null,
  ]
    .filter(Boolean)
    .join(' · ');
};

export const formatVesselLocationLine = (vessel) =>
  vessel?.base_location || vessel?.geographic_area || null;

export const parseEnginesString = (engines) => {
  if (!engines) return { count: null, power: null };
  const raw = String(engines);
  const paired = raw.match(/(\d+)\s*[×x]\s*(\d+)\s*HP/i);
  if (paired) return { count: paired[1], power: paired[2] };
  const countOnly = raw.match(/(\d+)\s+motor/i);
  if (countOnly) return { count: countOnly[1], power: null };
  const powerOnly = raw.match(/(\d+)\s*HP/i);
  if (powerOnly) return { count: null, power: powerOnly[1] };
  return { count: null, power: null };
};

/** Filas técnicas para pantalla de detalle de flota */
export const getFleetTechnicalRows = (vessel) => {
  if (!vessel) return [];
  const { count, power } = parseEnginesString(vessel.engines);
  return [
    ['Eslora', vessel.length_m != null ? `${vessel.length_m} m` : null],
    ['Manga', vessel.beam_m != null ? `${vessel.beam_m} m` : null],
    ['Calado', vessel.draft_m != null ? `${vessel.draft_m} m` : null],
    ['Puntal', vessel.depth_m != null ? `${vessel.depth_m} m` : null],
    ['Matrícula', vessel.registration],
    ['Color', vessel.color],
    ['Cantidad motores', count],
    ['Potencia motores', power ? `${power} HP c/u` : null],
    ['Tipo', vessel.type],
    ['Ámbito', vessel.geographic_area || vessel.base_location],
  ].filter(([, value]) => value != null && String(value).trim() !== '');
};

export const vesselToForm = (vessel) => {
  if (!vessel) return null;
  const { count, power } = parseEnginesString(vessel.engines);
  return {
    name: vessel.name || '',
    registration: vessel.registration || '',
    color: vessel.color || '',
    type: vessel.type || 'Motor',
    length_m: vessel.length_m != null ? String(vessel.length_m) : '',
    beam_m: vessel.beam_m != null ? String(vessel.beam_m) : '',
    draft_m: vessel.draft_m != null ? String(vessel.draft_m) : '',
    depth_m: vessel.depth_m != null ? String(vessel.depth_m) : '',
    engine_count: count != null ? String(count) : '',
    engine_power_hp: power != null ? String(power) : '',
    marina: vessel.base_location || '',
    geographic_area: vessel.geographic_area || '',
  };
};

/** Datos de embarcación que viajan con el auxilio (snapshot al pedir ayuda) */
export const buildVesselSnapshot = (vessel) => {
  if (!vessel) return null;
  return {
    id: vessel.id,
    name: vessel.name,
    registration: vessel.registration,
    type: vessel.type,
    length_m: vessel.length_m ?? null,
    beam_m: vessel.beam_m ?? null,
    draft_m: vessel.draft_m ?? null,
    depth_m: vessel.depth_m ?? null,
    color: vessel.color ?? null,
    engines: vessel.engines ?? null,
    geographic_area: vessel.geographic_area || vessel.base_location || null,
  };
};

export const getVesselDetailRows = (vessel) => {
  if (!vessel) return [];
  return [
    ['Matrícula', vessel.registration],
    ['Tipo', vessel.type],
    ['Eslora', vessel.length_m != null ? `${vessel.length_m} m` : null],
    ['Manga', vessel.beam_m != null ? `${vessel.beam_m} m` : null],
    ['Calado', vessel.draft_m != null ? `${vessel.draft_m} m` : null],
    ['Peso muerto', vessel.depth_m != null ? `${vessel.depth_m} t` : null],
    ['Motores', vessel.engines],
    ['Color', vessel.color],
    ['Ámbito', vessel.geographic_area],
  ].filter(([, value]) => value != null && String(value).trim() !== '');
};

export const getRegistrationMaxLength = () =>
  REGISTRATION_FORMAT.letterCount + REGISTRATION_FORMAT.separator.length + REGISTRATION_FORMAT.digitCount;

/** Inserta el guión automáticamente al completar las letras */
export const formatRegistrationInput = (text, format = REGISTRATION_FORMAT) => {
  const { letterCount, digitCount, separator } = format;
  const raw = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const letters = raw.replace(/[^A-Z]/g, '').slice(0, letterCount);
  const digits = raw
    .slice(letters.length)
    .replace(/[^0-9]/g, '')
    .slice(0, digitCount);

  if (!letters) return '';
  if (!digits && letters.length < letterCount) return letters;
  if (!digits) return `${letters}${separator}`;
  return `${letters}${separator}${digits}`;
};

export const isRegistrationComplete = (value, format = REGISTRATION_FORMAT) =>
  buildRegistrationPattern(format).test(value?.trim() || '');

export const getRegistrationFormatHint = () => {
  const { letterCount, digitCount, separator } = REGISTRATION_FORMAT;
  return `${letterCount} letras, guión (${separator}) y ${digitCount} números (ej. ${getRegistrationExample()})`;
};

export const parseDecimal = (value) => {
  if (value === '' || value == null) return null;
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

export const parseInteger = (value) => {
  if (value === '' || value == null) return null;
  const n = parseInt(String(value).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : NaN;
};

export const validateVesselForm = (form) => {
  const errors = {};

  const name = form.name?.trim() || '';
  if (!name) errors.name = 'El nombre es obligatorio';
  else if (name.length < 2) errors.name = 'Mínimo 2 caracteres';

  const registration = form.registration?.trim() || '';
  if (!registration) errors.registration = 'La matrícula es obligatoria';
  else if (!isRegistrationComplete(registration)) {
    errors.registration = `Formato: ${getRegistrationFormatHint()}`;
  }

  if (!form.type) errors.type = 'Elegí un tipo de embarcación';

  ['length_m', 'beam_m', 'draft_m', 'depth_m'].forEach((key) => {
    const raw = form[key];
    if (raw === '' || raw == null) return;
    const n = parseDecimal(raw);
    if (Number.isNaN(n) || n <= 0) {
      errors[key] = 'Ingresá un número mayor a 0';
    }
  });

  if (form.engine_count !== '' && form.engine_count != null) {
    const n = parseInteger(form.engine_count);
    if (Number.isNaN(n) || n < 0) errors.engine_count = 'Cantidad inválida';
  }

  if (form.engine_power_hp !== '' && form.engine_power_hp != null) {
    const n = parseInteger(form.engine_power_hp);
    if (Number.isNaN(n) || n < 0) errors.engine_power_hp = 'Potencia inválida';
  }

  const marina = form.marina?.trim() || '';
  if (!marina) errors.marina = 'Indicá guardería, club o barrio';

  const geographic = form.geographic_area?.trim() || '';
  if (!geographic) errors.geographic_area = 'Indicá el ámbito geográfico habitual';

  return errors;
};

export const buildVesselPayload = (form) => {
  const engineCount = parseInteger(form.engine_count);
  const enginePower = parseInteger(form.engine_power_hp);
  let engines = null;
  if (engineCount != null && enginePower != null) {
    engines = `${engineCount} × ${enginePower} HP`;
  } else if (engineCount != null) {
    engines = `${engineCount} motor${engineCount === 1 ? '' : 'es'}`;
  } else if (enginePower != null) {
    engines = `${enginePower} HP`;
  }

  return {
    name: form.name.trim(),
    registration: form.registration.trim().toUpperCase(),
    type: form.type,
    color: form.color?.trim() || null,
    length_m: parseDecimal(form.length_m),
    beam_m: parseDecimal(form.beam_m),
    draft_m: parseDecimal(form.draft_m),
    depth_m: parseDecimal(form.depth_m),
    engines,
    base_location: form.marina.trim(),
    geographic_area: form.geographic_area.trim(),
  };
};
