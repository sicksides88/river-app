import { formatExpiryLabel } from './subscriptionPlans';

export const hasInsuranceProfileData = (membership, user) => {
  const skipped = membership?.membership_skipped ?? user?.membership_skipped;
  if (skipped) return false;

  const company = (membership?.insurance_company || user?.insurance_company || '').trim();
  const policy = (membership?.policy_number || user?.policy_number || '').trim();
  return Boolean(company && policy);
};

export const getInsuranceCompanyLogoLabel = (companyName) => {
  const name = (companyName || '').trim();
  if (!name) return '[LOGO]';
  const token = name.split(/\s+/)[0]?.toUpperCase() || 'LOGO';
  return `[LOGO ${token}]`;
};

export const formatPolicyDisplay = (policyNumber) => {
  const value = (policyNumber || '').trim();
  if (!value) return '—';
  return `Póliza · ${value}`;
};

export const formatPolicyValidity = (expiryDate) => {
  const formatted = formatExpiryLabel(expiryDate);
  return `Vigente hasta ${formatted}`;
};

const isCompletedAuxilio = (auxilio) => {
  const status = (auxilio?.status || '').toLowerCase();
  return status === 'finalizado' || status === 'completed';
};

export const computeInsuranceCoverageUsage = (auxilios = []) => {
  const year = new Date().getFullYear();
  const completedThisYear = auxilios.filter((auxilio) => {
    if (!isCompletedAuxilio(auxilio)) return false;
    const raw = auxilio.createdAt || auxilio.created_at || auxilio.completedAt;
    if (!raw) return false;
    const date = new Date(raw);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === year;
  });

  const servicesUsed = completedThisYear.length;
  const hoursUsedRaw =
    completedThisYear.reduce((sum, auxilio) => sum + (Number(auxilio.durationMinutes) || 0), 0) /
    60;

  return {
    servicesUsed,
    servicesLimit: 8,
    hoursUsed: Math.round(hoursUsedRaw * 10) / 10,
    hoursLimit: 20,
  };
};

export const formatCoverageValue = (used, limit, unit = '') => {
  const usedLabel = Number.isInteger(used) ? String(used) : used.toFixed(1);
  return `${usedLabel} / ${limit}${unit ? ` ${unit}` : ''}`;
};
