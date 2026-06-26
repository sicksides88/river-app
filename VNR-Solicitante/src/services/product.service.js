import api from './api';

export const productService = {
  /**
   * Obtener productos con paginación y filtros
   */
  async getProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  /**
   * Obtener producto por ID
   */
  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Obtener categorías activas
   */
  async getCategories() {
    const response = await api.get('/products/categories');
    return response.data;
  },

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(categoryId, params = {}) {
    const response = await api.get(`/products/category/${categoryId}`, { params });
    return response.data;
  },

  /**
   * Buscar productos por nombre
   */
  async searchProducts(query, params = {}) {
    const response = await api.get('/products/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },
};

export default productService;
