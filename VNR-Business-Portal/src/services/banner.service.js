import { supabase } from './supabase';

/**
 * Servicio para obtener banners/carousel del CRM (Supabase)
 */
const bannerService = {
  /**
   * Obtener todos los banners activos
   * @returns {Promise<{success: boolean, banners: Array, error?: string}>}
   */
  async getBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        banners: data || [],
      };
    } catch (error) {
      console.error('Error fetching banners:', error);
      return {
        success: false,
        banners: [],
        error: error.message,
      };
    }
  },

  /**
   * Obtener banners por ubicación (home, services, etc.)
   * @param {string} location - Ubicación del banner
   * @returns {Promise<{success: boolean, banners: Array, error?: string}>}
   */
  async getBannersByLocation(location) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('location', location)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        banners: data || [],
      };
    } catch (error) {
      console.error('Error fetching banners by location:', error);
      return {
        success: false,
        banners: [],
        error: error.message,
      };
    }
  },

  /**
   * Registrar click en un banner (analytics)
   * @param {string} bannerId - ID del banner
   */
  async trackBannerClick(bannerId) {
    try {
      await supabase.rpc('increment_banner_clicks', { banner_id: bannerId });
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }
  },
};

export default bannerService;
