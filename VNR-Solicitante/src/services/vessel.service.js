import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_VESSEL_KEY = '@river_active_vessel_id';

export const vesselService = {
  async getVessels() {
    const response = await api.get('/vessels');
    return { success: true, vessels: response.data?.vessels || [] };
  },

  async getVesselById(id) {
    const response = await api.get(`/vessels/${id}`);
    return { success: true, vessel: response.data?.vessel };
  },

  async createVessel(data) {
    const response = await api.post('/vessels', data);
    return { success: true, vessel: response.data?.vessel };
  },

  async updateVessel(id, data) {
    const response = await api.put(`/vessels/${id}`, data);
    return { success: true, vessel: response.data?.vessel };
  },

  async deleteVessel(id) {
    await api.delete(`/vessels/${id}`);
    return { success: true };
  },

  async getActiveVesselId() {
    return AsyncStorage.getItem(ACTIVE_VESSEL_KEY);
  },

  async setActiveVesselId(id) {
    await AsyncStorage.setItem(ACTIVE_VESSEL_KEY, id);
  },

  async clearActiveVesselId() {
    await AsyncStorage.removeItem(ACTIVE_VESSEL_KEY);
  },

  async resolveActiveVessel(cachedVessels = []) {
    const activeId = await this.getActiveVesselId();
    const fromCache =
      cachedVessels.find((v) => v.id === activeId) ||
      cachedVessels[0] ||
      null;

    if (fromCache) return fromCache;

    if (activeId) {
      try {
        const { vessel } = await this.getVesselById(activeId);
        return vessel || null;
      } catch {
        return null;
      }
    }

    return null;
  },

  async hasVessels() {
    const { vessels } = await this.getVessels();
    return vessels.length > 0;
  },
};

export default vesselService;
