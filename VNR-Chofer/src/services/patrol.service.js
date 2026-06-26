import api from './api';

export const patrolService = {
  async getMyShift() {
    const { data } = await api.get('/patrols/my-shift');
    return data;
  },

  async getMyShifts() {
    const { data } = await api.get('/patrols/my-shifts');
    return data;
  },
};

export default patrolService;
