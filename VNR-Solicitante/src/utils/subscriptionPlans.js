export const SUBSCRIPTION_PLANS = [
  {
    id: 'bronce',
    name: 'Bronce',
    subtitle: 'Hasta 6 m · auxilios básicos',
    annualPrice: 12000,
    monthlyPrice: 1200,
  },
  {
    id: 'plata',
    name: 'Plata',
    subtitle: 'Hasta 9 m · ilimitado en zona',
    annualPrice: 24000,
    monthlyPrice: 2400,
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Hasta 14 m · cobertura total',
    annualPrice: 42000,
    monthlyPrice: 4200,
  },
];

export const DEFAULT_CURRENT_PLAN_ID = 'premium';

export const formatPlanPrice = (amount, billingCycle) => {
  const formatted = `$ ${amount.toLocaleString('es-AR')}`;
  return billingCycle === 'annual' ? `${formatted} / año` : `${formatted} / mes`;
};

export const formatExpiryLabel = (expiryDate) => {
  if (!expiryDate) return '20/06/2026';
  const trimmed = String(expiryDate).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return trimmed.replace(/\s/g, '');
};

export const getPlanById = (planId) =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) || SUBSCRIPTION_PLANS[0];

export const normalizePlanId = (planId) => {
  const value = String(planId || '').toLowerCase();
  return SUBSCRIPTION_PLANS.some((plan) => plan.id === value) ? value : null;
};

export const normalizeBillingCycle = (cycle) =>
  cycle === 'monthly' ? 'monthly' : 'annual';

export const resolveCurrentPlanId = (user, membership) => {
  const storedPlan = normalizePlanId(membership?.subscription_plan || user?.subscription_plan);
  if (storedPlan) return storedPlan;

  if (membership?.link_type === 'aseguradora' && membership?.insurance_company) {
    return 'premium';
  }
  if (membership?.onboarding_completed || user?.onboarding_completed) {
    return 'premium';
  }
  return 'bronce';
};

export const resolveBillingCycle = (membership, user) =>
  normalizeBillingCycle(
    membership?.subscription_billing_cycle || user?.subscription_billing_cycle
  );

export const resolveSubscriptionExpiry = (membership, user) => {
  const expiry =
    membership?.subscription_expires_at ||
    user?.subscription_expires_at ||
    membership?.policy_expiry_date;
  return formatExpiryLabel(expiry);
};

export const getPlanDisplayName = (planId) => getPlanById(planId).name;
