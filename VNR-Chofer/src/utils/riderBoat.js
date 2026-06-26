/** Embarcación de auxilio del patrón (driver_vehicles tipo boat). */

export const EMPTY_BOAT_FORM = {
  name: '',
  plateNumber: '',
  color: '',
  year: '',
  capacity: '',
  lengthM: '',
  beamM: '',
  draftM: '',
  towCapacityM: '',
  motorCount: '',
  motorPowerHp: '',
  hullType: '',
  operatingArea: '',
};

export const pickActiveAuxilioBoat = (vehicles = []) => {
  if (!Array.isArray(vehicles) || !vehicles.length) return null;
  const boats = vehicles.filter(
    (v) => v.vehicle_type === 'boat' || v.vehicleType === 'boat' || !v.vehicle_type
  );
  const list = boats.length ? boats : vehicles;
  return list.find((v) => v.is_active) || list[0];
};

export const getBoatDisplayName = (vehicle) => {
  if (!vehicle) return '—';
  const specs = vehicle.specs || {};
  if (specs.display_name) return specs.display_name;
  const brand = vehicle.brand?.trim();
  const model = vehicle.model?.trim();
  if (brand && model && brand !== 'River') return `${brand} ${model}`.trim();
  if (model) return model;
  if (brand) return brand;
  return 'Embarcación de auxilio';
};

export const vehicleToTechnicalRows = (vehicle) => {
  if (!vehicle) return [];
  const specs = vehicle.specs || {};
  const fmt = (val, suffix = '') => {
    if (val == null || val === '') return '—';
    return suffix ? `${val} ${suffix}` : String(val);
  };

  return [
    ['Eslora', fmt(specs.length_m, 'm')],
    ['Manga', fmt(specs.beam_m, 'm')],
    ['Calado', fmt(specs.draft_m, 'm')],
    ['Capacidad remolque', specs.tow_capacity_m ? `Hasta ${specs.tow_capacity_m} m` : '—'],
    ['Matrícula', vehicle.plate_number || vehicle.plateNumber || '—'],
    ['Color', vehicle.color || '—'],
    ['Cantidad motores', fmt(specs.motor_count)],
    ['Potencia motores', specs.motor_power_hp ? `${specs.motor_power_hp} HP c/u` : '—'],
    ['Tipo', specs.hull_type || vehicle.model || '—'],
    ['Ámbito', specs.operating_area || '—'],
  ];
};

export const vehicleToForm = (vehicle) => {
  if (!vehicle) return { ...EMPTY_BOAT_FORM };
  const specs = vehicle.specs || {};
  return {
    name: getBoatDisplayName(vehicle),
    plateNumber: vehicle.plate_number || vehicle.plateNumber || '',
    color: vehicle.color || '',
    year: vehicle.year != null ? String(vehicle.year) : '',
    capacity: vehicle.capacity != null ? String(vehicle.capacity) : '',
    lengthM: specs.length_m != null ? String(specs.length_m) : '',
    beamM: specs.beam_m != null ? String(specs.beam_m) : '',
    draftM: specs.draft_m != null ? String(specs.draft_m) : '',
    towCapacityM: specs.tow_capacity_m != null ? String(specs.tow_capacity_m) : '',
    motorCount: specs.motor_count != null ? String(specs.motor_count) : '',
    motorPowerHp: specs.motor_power_hp != null ? String(specs.motor_power_hp) : '',
    hullType: specs.hull_type || '',
    operatingArea: specs.operating_area || '',
  };
};

const numOrNull = (val) => {
  if (val == null || val === '') return null;
  const n = Number(String(val).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const formToVehiclePayload = (form) => {
  const name = form.name?.trim() || 'Embarcación de auxilio';
  return {
    vehicleType: 'boat',
    brand: 'River',
    model: form.hullType?.trim() || name,
    year: numOrNull(form.year) || new Date().getFullYear(),
    color: form.color?.trim() || null,
    plateNumber: form.plateNumber?.trim(),
    capacity: numOrNull(form.capacity) || 6,
    specs: {
      display_name: name,
      length_m: numOrNull(form.lengthM),
      beam_m: numOrNull(form.beamM),
      draft_m: numOrNull(form.draftM),
      tow_capacity_m: numOrNull(form.towCapacityM),
      motor_count: numOrNull(form.motorCount),
      motor_power_hp: numOrNull(form.motorPowerHp),
      hull_type: form.hullType?.trim() || null,
      operating_area: form.operatingArea?.trim() || null,
    },
  };
};
