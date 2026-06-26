import * as Location from 'expo-location';
import { CONFIG } from '../constants/config';
import mapsService from './maps.service';
import api from './api';

export const locationService = {
  /**
   * Solicitar permisos de ubicación
   */
  async requestPermissions() {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      return {
        granted: false,
        message: 'Se requiere permiso de ubicación para usar esta función',
      };
    }

    return { granted: true };
  },

  /**
   * Obtener ubicación actual
   */
  async getCurrentLocation() {
    try {
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        throw new Error(permission.message);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: CONFIG.LOCATION_TIMEOUT || 15000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  },

  /**
   * Obtener dirección desde coordenadas (reverse geocoding)
   */
  async getAddressFromCoords(latitude, longitude) {
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result) {
        const parts = [
          result.street,
          result.streetNumber,
          result.district,
          result.city,
          result.region,
        ].filter(Boolean);

        return {
          formatted: parts.join(', '),
          street: result.street,
          streetNumber: result.streetNumber,
          district: result.district,
          city: result.city,
          region: result.region,
          country: result.country,
          postalCode: result.postalCode,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  },

  /**
   * Obtener coordenadas desde dirección (geocoding)
   */
  async getCoordsFromAddress(address) {
    try {
      const results = await Location.geocodeAsync(address);

      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      return null;
    }
  },

  /**
   * Calcular distancia entre dos puntos (en km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  },

  toRad(deg) {
    return deg * (Math.PI / 180);
  },

  /**
   * Buscar lugares con Google Places API (via backend proxy)
   * @param {string} query - Texto a buscar
   * @param {object} location - Ubicación actual para priorizar resultados cercanos
   * @returns {Promise<Array>} Lista de sugerencias
   */
  async searchPlaces(query, location = null) {
    try {
      // Usar el servicio de maps que va al backend (API key segura)
      const results = await mapsService.searchPlaces(query, location);
      return results;
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  },

  /**
   * Obtener detalles de un lugar por place_id (via backend proxy)
   * @param {string} placeId - ID del lugar de Google
   * @returns {Promise<object|null>} Detalles del lugar
   */
  async getPlaceDetails(placeId) {
    try {
      // Usar el servicio de maps que va al backend (API key segura)
      const details = await mapsService.getPlaceDetails(placeId);

      if (details) {
        // Normalizar el formato de coordenadas para compatibilidad
        return {
          name: details.name,
          address: details.address,
          coordinates: {
            latitude: details.coordinates?.latitude,
            longitude: details.coordinates?.longitude,
            // Alias para compatibilidad con código existente
            lat: details.coordinates?.latitude,
            lng: details.coordinates?.longitude,
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  },

  /**
   * Reverse geocode usando backend (más preciso que expo-location)
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<object|null>}
   */
  async reverseGeocodeViaAPI(latitude, longitude) {
    try {
      const result = await mapsService.reverseGeocode(latitude, longitude);
      if (result) {
        return {
          formatted: result.formattedAddress,
          street: result.components?.street,
          streetNumber: result.components?.streetNumber,
          city: result.components?.city,
          region: result.components?.state,
          country: result.components?.country,
          postalCode: result.components?.postalCode,
        };
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding via API:', error);
      return null;
    }
  },

  /**
   * Suscribirse a actualizaciones de ubicación
   */
  async watchLocation(callback, options = {}) {
    const permission = await this.requestPermissions();
    if (!permission.granted) {
      throw new Error(permission.message);
    }

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: options.timeInterval || 10000,
        distanceInterval: options.distanceInterval || 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
        });
      }
    );
  },

  /**
   * Obtener ubicaciones recientes del usuario
   * @param {number} limit - Cantidad máxima de ubicaciones
   * @returns {Promise<Array>} Lista de ubicaciones recientes
   */
  async getRecentLocations(limit = 5) {
    try {
      const response = await api.get('/locations/recent', { params: { limit } });
      return response.data.locations || [];
    } catch (error) {
      console.error('Error getting recent locations:', error?.message || error, error?.response?.data);
      return [];
    }
  },

  /**
   * Obtener ubicaciones frecuentes del usuario
   * @param {number} limit - Cantidad máxima de ubicaciones
   * @returns {Promise<Array>} Lista de ubicaciones frecuentes
   */
  async getFrequentLocations(limit = 5) {
    try {
      const response = await api.get('/locations/frequent', { params: { limit } });
      return response.data.locations || [];
    } catch (error) {
      console.error('Error getting frequent locations:', error);
      return [];
    }
  },
};

export default locationService;
