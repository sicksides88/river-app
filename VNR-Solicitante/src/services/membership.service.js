import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@river_onboarding_complete';

export const membershipService = {
  async getMembership() {
    const response = await api.get('/membership');
    return response.data;
  },

  async setLinkType(linkType) {
    const response = await api.put('/membership/link-type', { link_type: linkType });
    return response.data;
  },

  async saveAseguradora(data) {
    const response = await api.put('/membership/aseguradora', data);
    return response.data;
  },

  async saveIndependiente(data) {
    const response = await api.put('/membership/independiente', data);
    return response.data;
  },

  async completeOnboarding() {
    const response = await api.post('/membership/complete');
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    return response.data;
  },

  async setSubscription({ planId, billingCycle }) {
    const response = await api.put('/membership/subscription', {
      plan_id: planId,
      billing_cycle: billingCycle,
    });
    return response.data;
  },

  async cancelSubscription() {
    const response = await api.post('/membership/subscription/cancel');
    return response.data;
  },

  async isOnboardingCompleteLocal() {
    return (await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)) === 'true';
  },

  async syncOnboardingFromUser(user) {
    if (user?.onboarding_completed) {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    }
    return Boolean(user?.onboarding_completed);
  },
};

export default membershipService;
