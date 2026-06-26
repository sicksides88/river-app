/**
 * Maps Service (Frontend)
 * Uses backend proxy for Google Maps API calls
 * This keeps the API key secure on the server
 */

import api from './api';

const mapsService = {
  // ==========================================
  // PLACES API
  // ==========================================

  /**
   * Search places with autocomplete
   * @param {string} input - Search query
   * @param {object} location - Current location (optional)
   * @returns {Promise<Array>} Place predictions
   */
  async searchPlaces(input, location = null) {
    try {
      let url = `/maps/places/search?input=${encodeURIComponent(input)}`;

      if (location?.latitude && location?.longitude) {
        url += `&lat=${location.latitude}&lng=${location.longitude}`;
      }

      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  },

  /**
   * Get place details by place_id
   * @param {string} placeId - Google place ID
   * @returns {Promise<object|null>} Place details
   */
  async getPlaceDetails(placeId) {
    try {
      const response = await api.get(`/maps/places/${placeId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  },

  // ==========================================
  // DIRECTIONS API
  // ==========================================

  /**
   * Get route between two points
   * @param {object} origin - Origin { latitude, longitude }
   * @param {object} destination - Destination { latitude, longitude }
   * @param {object} options - Route options
   * @returns {Promise<object|null>} Route data
   */
  async getDirections(origin, destination, options = {}) {
    try {
      const response = await api.post('/maps/directions', {
        origin,
        destination,
        options,
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  },

  /**
   * Get route with polyline decoded
   * @param {object} origin - Origin { latitude, longitude }
   * @param {object} destination - Destination { latitude, longitude }
   * @returns {Promise<object>} Route with decoded polyline
   */
  async getRouteWithPolyline(origin, destination) {
    const directions = await this.getDirections(origin, destination);

    if (!directions?.primaryRoute) {
      return null;
    }

    const polylinePoints = this.decodePolyline(directions.primaryRoute.polyline);

    return {
      ...directions.primaryRoute,
      polylinePoints,
    };
  },

  /**
   * Get distance matrix
   * @param {Array} origins - Array of origin coordinates
   * @param {Array} destinations - Array of destination coordinates
   * @returns {Promise<object|null>} Distance matrix
   */
  async getDistanceMatrix(origins, destinations) {
    try {
      const response = await api.post('/maps/distance-matrix', {
        origins,
        destinations,
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      return null;
    }
  },

  // ==========================================
  // GEOCODING API
  // ==========================================

  /**
   * Geocode an address
   * @param {string} address - Address to geocode
   * @returns {Promise<object|null>} Coordinates and formatted address
   */
  async geocode(address) {
    try {
      const response = await api.get(`/maps/geocode?address=${encodeURIComponent(address)}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  },

  /**
   * Reverse geocode coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<object|null>} Address details
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const response = await api.get(`/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  },

  // ==========================================
  // ETA
  // ==========================================

  /**
   * Calculate ETA between two points
   * @param {object} origin - Origin coordinates
   * @param {object} destination - Destination coordinates
   * @returns {Promise<object|null>} ETA data
   */
  async calculateETA(origin, destination) {
    try {
      const response = await api.post('/maps/eta', {
        origin,
        destination,
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return null;
    }
  },

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Decode Google polyline string
   * @param {string} encoded - Encoded polyline string
   * @returns {Array} Array of { latitude, longitude } coordinates
   */
  decodePolyline(encoded) {
    if (!encoded) return [];

    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  },

  /**
   * Calculate bearing between two points
   * @param {object} start - Start coordinates
   * @param {object} end - End coordinates
   * @returns {number} Bearing in degrees (0-360)
   */
  calculateBearing(start, end) {
    const startLat = (start.latitude * Math.PI) / 180;
    const startLng = (start.longitude * Math.PI) / 180;
    const endLat = (end.latitude * Math.PI) / 180;
    const endLng = (end.longitude * Math.PI) / 180;

    const dLng = endLng - startLng;

    const x = Math.sin(dLng) * Math.cos(endLat);
    const y =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = (Math.atan2(x, y) * 180) / Math.PI;
    return (bearing + 360) % 360;
  },

  /**
   * Calculate distance between two points (Haversine)
   * @param {object} point1 - First point { latitude, longitude }
   * @param {object} point2 - Second point { latitude, longitude }
   * @returns {number} Distance in kilometers
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Format distance for display
   * @param {number} distanceKm - Distance in kilometers
   * @returns {string} Formatted distance
   */
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  },

  /**
   * Format duration for display
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds} seg`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }

    return `${minutes} min`;
  },
};

export default mapsService;
