import api from './api';

export const couponService = {
  /**
   * Validar un código de cupón
   */
  async validateCoupon(code, cartTotal) {
    const response = await api.post('/coupons/validate', { code, cartTotal });
    return response.data;
  },

  /**
   * Aplicar cupón y obtener cálculo de descuento
   */
  async applyCoupon(code, cartTotal, shippingCost) {
    const response = await api.post('/coupons/apply', {
      code,
      cartTotal,
      shippingCost
    });
    return response.data;
  },
};

export default couponService;
