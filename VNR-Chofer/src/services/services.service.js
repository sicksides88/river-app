import api from './api';

// Mapea los ids locales de servicio (que difieren entre pantallas) al
// service_type canónico del backend (tabla service_rates / CRM).
const CANONICAL = {
  cadete: 'envios',
  envio: 'envios',
  envios: 'envios',
  flete: 'fletes',
  fletes: 'fletes',
  chofer: 'chofer',
  vuelta_segura: 'vuelta_segura',
  'vuelta-segura': 'vuelta_segura',
};

export const toCanonicalService = (id) => CANONICAL[id] || id;

const servicesService = {
  /**
   * Servicios habilitados por la plataforma (CRM: service_rates.is_active).
   * Devuelve un array de service_type canónicos, o null si no se pudo obtener
   * (en ese caso las pantallas hacen fallback a mostrar todos).
   */
  async getEnabled() {
    try {
      const { data } = await api.get('/pricing/services');
      return Array.isArray(data?.services) ? data.services : null;
    } catch (e) {
      return null;
    }
  },
};

export default servicesService;
