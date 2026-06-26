import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_VESSEL_KEY = '@river_active_vessel_id';
const LINK_TYPE_KEY = '@river_link_type';

export const vesselService = {
  async getVessels() {
    try {
      const response = await api.get('/vessels');
      return { success: true, vessels: response.data?.vessels || [] };
    } catch (error) {
      // Fallback local para desarrollo sin backend
      const local = await AsyncStorage.getItem('@river_vessels');
      return { success: true, vessels: local ? JSON.parse(local) : [] };
    }
  },

  async getVesselById(id) {
    const response = await api.get(`/vessels/${id}`);
    return { success: true, vessel: response.data?.vessel };
  },

  async createVessel(data) {
    try {
      const response = await api.post('/vessels', data);
      return { success: true, vessel: response.data?.vessel };
    } catch {
      const local = await AsyncStorage.getItem('@river_vessels');
      const vessels = local ? JSON.parse(local) : [];
      const vessel = {
        id: `local-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
      };
      vessels.push(vessel);
      await AsyncStorage.setItem('@river_vessels', JSON.stringify(vessels));
      return { success: true, vessel };
    }
  },

  async updateVessel(id, data) {
    try {
      const response = await api.put(`/vessels/${id}`, data);
      return { success: true, vessel: response.data?.vessel };
    } catch {
      const local = await AsyncStorage.getItem('@river_vessels');
      const vessels = local ? JSON.parse(local) : [];
      const idx = vessels.findIndex((v) => v.id === id);
      if (idx >= 0) {
        vessels[idx] = { ...vessels[idx], ...data };
        await AsyncStorage.setItem('@river_vessels', JSON.stringify(vessels));
        return { success: true, vessel: vessels[idx] };
      }
      return { success: false, message: 'Embarcación no encontrada' };
    }
  },

  async deleteVessel(id) {
    try {
      await api.delete(`/vessels/${id}`);
      return { success: true };
    } catch {
      const local = await AsyncStorage.getItem('@river_vessels');
      const vessels = (local ? JSON.parse(local) : []).filter((v) => v.id !== id);
      await AsyncStorage.setItem('@river_vessels', JSON.stringify(vessels));
      return { success: true };
    }
  },

  async getActiveVesselId() {
    return AsyncStorage.getItem(ACTIVE_VESSEL_KEY);
  },

  async setActiveVesselId(id) {
    await AsyncStorage.setItem(ACTIVE_VESSEL_KEY, id);
  },

  async getLinkType() {
    return (await AsyncStorage.getItem(LINK_TYPE_KEY)) || 'independiente';
  },

  async setLinkType(type) {
    await AsyncStorage.setItem(LINK_TYPE_KEY, type);
  },

  async hasVessels() {
    const { vessels } = await this.getVessels();
    return vessels.length > 0;
  },
};

export default vesselService;
