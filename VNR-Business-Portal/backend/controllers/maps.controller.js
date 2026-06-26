/**
 * Maps Controller
 * Handles Google Maps API proxy requests
 */

import mapsService from '../services/maps.service.js';

const mapsController = {
  /**
   * Search places with autocomplete
   * GET /api/maps/places/search?input=...&lat=...&lng=...
   */
  async searchPlaces(req, res, next) {
    try {
      const { input, lat, lng } = req.query;

      if (!input || input.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere al menos 2 caracteres para buscar',
        });
      }

      const options = {
        userId: req.user?.id,
      };

      if (lat && lng) {
        options.location = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        };
      }

      const predictions = await mapsService.searchPlaces(input, options);

      res.json({
        success: true,
        data: predictions,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get place details by place_id
   * GET /api/maps/places/:placeId
   */
  async getPlaceDetails(req, res, next) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        return res.status(400).json({
          success: false,
          error: 'place_id es requerido',
        });
      }

      const details = await mapsService.getPlaceDetails(placeId, req.user?.id);

      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get directions between two points
   * POST /api/maps/directions
   * Body: { origin: { latitude, longitude }, destination: { latitude, longitude }, options }
   */
  async getDirections(req, res, next) {
    try {
      const { origin, destination, options = {} } = req.body;

      if (!origin?.latitude || !origin?.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas de origen son requeridas',
        });
      }

      if (!destination?.latitude || !destination?.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas de destino son requeridas',
        });
      }

      const directions = await mapsService.getDirections(origin, destination, options);

      res.json({
        success: true,
        data: directions,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get distance matrix
   * POST /api/maps/distance-matrix
   * Body: { origins: [], destinations: [], options }
   */
  async getDistanceMatrix(req, res, next) {
    try {
      const { origins, destinations, options = {} } = req.body;

      if (!origins || !Array.isArray(origins) || origins.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere al menos un origen',
        });
      }

      if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere al menos un destino',
        });
      }

      const matrix = await mapsService.getDistanceMatrix(origins, destinations, options);

      res.json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Geocode an address
   * GET /api/maps/geocode?address=...
   */
  async geocode(req, res, next) {
    try {
      const { address } = req.query;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Dirección es requerida',
        });
      }

      const result = await mapsService.geocode(address);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No se encontraron resultados para la dirección',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reverse geocode coordinates
   * GET /api/maps/reverse-geocode?lat=...&lng=...
   */
  async reverseGeocode(req, res, next) {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitud y longitud son requeridas',
        });
      }

      const result = await mapsService.reverseGeocode(parseFloat(lat), parseFloat(lng));

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró dirección para las coordenadas',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Calculate ETA between two points
   * POST /api/maps/eta
   * Body: { origin: { latitude, longitude }, destination: { latitude, longitude } }
   */
  async calculateETA(req, res, next) {
    try {
      const { origin, destination } = req.body;

      if (!origin?.latitude || !origin?.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas de origen son requeridas',
        });
      }

      if (!destination?.latitude || !destination?.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas de destino son requeridas',
        });
      }

      const eta = await mapsService.calculateETA(origin, destination);

      res.json({
        success: true,
        data: eta,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default mapsController;
