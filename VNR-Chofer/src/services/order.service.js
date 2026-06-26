import api from './api';

export const orderService = {
  /**
   * Crear una nueva orden
   */
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  /**
   * Obtener órdenes del usuario (paginado)
   */
  async getOrders(params = {}) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  /**
   * Obtener orden por ID
   */
  async getOrderById(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
};

export default orderService;
