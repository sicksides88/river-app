/** Tipos de cuenta bancaria (débito de cuota) */
export const ACCOUNT_TYPE_OPTIONS = [
  { id: 'caja_ahorro_ars', label: 'Caja de ahorro · Pesos' },
  { id: 'cuenta_corriente_ars', label: 'Cuenta corriente · Pesos' },
  { id: 'caja_ahorro_usd', label: 'Caja de ahorro · Dólares' },
  { id: 'cuenta_corriente_usd', label: 'Cuenta corriente · Dólares' },
];

export const DEFAULT_ACCOUNT_TYPE = ACCOUNT_TYPE_OPTIONS[0].id;

export const getAccountTypeLabel = (id) =>
  ACCOUNT_TYPE_OPTIONS.find((o) => o.id === id)?.label || '';

export const isValidAccountType = (id) =>
  ACCOUNT_TYPE_OPTIONS.some((o) => o.id === id);

/** Preferencia de vencimiento del débito */
export const BILLING_PREFERENCE_OPTIONS = [
  { id: '1-10', label: 'Del 1 al 10' },
  { id: '11-20', label: 'Del 11 al 20' },
  { id: '21-fin', label: 'Del 21 al fin de mes' },
];

export const DEFAULT_BILLING_PREFERENCE = BILLING_PREFERENCE_OPTIONS[0].id;

export const getBillingPreferenceLabel = (id) =>
  BILLING_PREFERENCE_OPTIONS.find((o) => o.id === id)?.label || '';

export const isValidBillingPreference = (id) =>
  BILLING_PREFERENCE_OPTIONS.some((o) => o.id === id);

/** Formatea CUIL/CUIT: XX-XXXXXXXX-X */
export const formatCuilCuit = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
};

/** Formatea CBU: solo dígitos, agrupados de a 4 */
export const formatCbu = (text) => {
  const digits = text.replace(/\D/g, '');
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/** Formatea fecha DD/MM/YYYY */
export const formatPolicyDate = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
};

/** Nº de póliza: letras, números y guión */
export const formatPolicyNumber = (text) =>
  text.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);

export const isCuilCuitComplete = (value) =>
  /^\d{2}-\d{8}-\d$/.test(value?.trim() || '');

export const isCbuValid = (value) => /^\d+$/.test(value?.replace(/\D/g, '') || '');

export const isPolicyDateComplete = (value) =>
  /^\d{2} \/ \d{2} \/ \d{4}$/.test(value?.trim() || '');

export const isPolicyNumberComplete = (value) =>
  /^[A-Z0-9-]{4,24}$/.test(value?.trim() || '');

export const validateIndependienteForm = (form) => {
  const errors = {};
  const holder = form.account_holder?.trim() || '';

  if (!holder) errors.account_holder = 'Ingresá el titular de la cuenta';
  else if (holder.length < 3) errors.account_holder = 'Mínimo 3 caracteres';
  else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]+$/.test(holder)) {
    errors.account_holder = 'Solo letras y espacios';
  }

  if (!isValidAccountType(form.account_type)) {
    errors.account_type = 'Elegí un tipo de cuenta';
  }

  if (!form.cuil_cuit?.trim()) errors.cuil_cuit = 'El CUIL/CUIT es obligatorio';
  else if (!isCuilCuitComplete(form.cuil_cuit)) {
    errors.cuil_cuit = 'Formato: XX-XXXXXXXX-X';
  }

  if (!form.cbu?.trim()) errors.cbu = 'El CBU es obligatorio';
  else if (!isCbuValid(form.cbu)) errors.cbu = 'El CBU solo puede contener números';

  const bank = form.bank_name?.trim() || '';
  if (!bank) errors.bank_name = 'Ingresá el nombre del banco';
  else if (bank.length < 2) errors.bank_name = 'Mínimo 2 caracteres';

  if (!isValidBillingPreference(form.billing_preference)) {
    errors.billing_preference = 'Elegí una preferencia de vencimiento';
  }

  return errors;
};

export const validateAseguradoraForm = (form, { includeBank = false } = {}) => {
  const errors = {};
  const company = form.insurance_company?.trim() || '';

  if (!company) errors.insurance_company = 'Ingresá la compañía aseguradora';
  else if (company.length < 2) errors.insurance_company = 'Mínimo 2 caracteres';

  if (!form.policy_number?.trim()) errors.policy_number = 'Ingresá el nº de póliza';
  else if (!isPolicyNumberComplete(form.policy_number)) {
    errors.policy_number = 'Formato inválido (ej. POL-892341)';
  }

  if (form.expiry_date?.trim() && !isPolicyDateComplete(form.expiry_date)) {
    errors.expiry_date = 'Formato: DD / MM / YYYY';
  }

  if (includeBank) {
    Object.assign(errors, validateIndependienteForm(form));
  }

  return errors;
};

export const buildIndependientePayload = (form) => ({
  account_holder: form.account_holder.trim(),
  account_type: getAccountTypeLabel(form.account_type),
  account_type_id: form.account_type,
  cuil_cuit: form.cuil_cuit.replace(/-/g, ''),
  cbu: form.cbu.replace(/\D/g, ''),
  bank_name: form.bank_name.trim(),
  billing_preference: getBillingPreferenceLabel(form.billing_preference),
  billing_preference_id: form.billing_preference,
  skipped: false,
});
