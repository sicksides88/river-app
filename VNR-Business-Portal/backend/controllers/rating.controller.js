import ratingService from '../services/rating.service.js';

/**
 * Controller de Calificaciones
 */
const ratingController = {
  /**
   * Crear calificación de viaje
   * POST /api/ratings/ride
   */
  async createRideRating(req, res) {
    try {
      const { rideId, ratedId, stars, comment, tags } = req.body;
      const raterId = req.user.id;

      // Validar datos requeridos
      if (!rideId || !ratedId || !stars) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos: rideId, ratedId, stars',
        });
      }

      // Validar estrellas
      if (stars < 1 || stars > 5) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe ser entre 1 y 5 estrellas',
        });
      }

      // Determinar tipo de calificación
      const canRate = await ratingService.canRateRide(rideId, raterId);
      if (!canRate.canRate) {
        return res.status(400).json({
          success: false,
          message: canRate.reason,
        });
      }

      const rating = await ratingService.createRideRating({
        rideId,
        raterId,
        ratedId,
        ratingType: canRate.ratingType,
        stars,
        comment,
        tags,
      });

      res.status(201).json({
        success: true,
        message: 'Calificación creada exitosamente',
        rating,
      });
    } catch (error) {
      console.error('Error creating ride rating:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear calificación',
      });
    }
  },

  /**
   * Crear calificación de entrega
   * POST /api/ratings/delivery
   */
  async createDeliveryRating(req, res) {
    try {
      const { deliveryId, ratedId, ratingType, stars, comment, tags } = req.body;
      const raterId = req.user.id;

      console.log('📝 Rating delivery request:', { deliveryId, ratedId, ratingType, stars, raterId });

      // Validar datos requeridos
      if (!deliveryId || !ratedId || !ratingType || !stars) {
        console.log('❌ Missing required fields:', { deliveryId, ratedId, ratingType, stars });
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos',
        });
      }

      const rating = await ratingService.createDeliveryRating({
        deliveryId,
        raterId,
        ratedId,
        ratingType,
        stars,
        comment,
        tags,
      });

      res.status(201).json({
        success: true,
        message: 'Calificación creada exitosamente',
        rating,
      });
    } catch (error) {
      console.error('Error creating delivery rating:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear calificación',
      });
    }
  },

  /**
   * Obtener mis calificaciones recibidas
   * GET /api/ratings/me
   */
  async getMyRatings(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await ratingService.getUserRatings(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener calificaciones',
      });
    }
  },

  /**
   * Obtener estadísticas de calificación propias
   * GET /api/ratings/me/stats
   */
  async getMyRatingStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await ratingService.getRatingStats(userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  },

  /**
   * Obtener calificaciones de un usuario específico
   * GET /api/ratings/user/:userId
   */
  async getUserRatings(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await ratingService.getUserRatings(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener calificaciones',
      });
    }
  },

  /**
   * Obtener estadísticas de calificación de un usuario
   * GET /api/ratings/user/:userId/stats
   */
  async getUserRatingStats(req, res) {
    try {
      const { userId } = req.params;
      const stats = await ratingService.getRatingStats(userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error('Error fetching user rating stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  },

  /**
   * Verificar si puedo calificar un viaje
   * GET /api/ratings/can-rate/ride/:rideId
   */
  async canRateRide(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;

      const result = await ratingService.canRateRide(rideId, userId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error checking if can rate:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al verificar',
      });
    }
  },

  /**
   * Obtener calificación de un viaje (si existe)
   * GET /api/ratings/ride/:rideId
   */
  async getRideRating(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;

      const rating = await ratingService.getRideRating(rideId, userId);

      res.json({
        success: true,
        rating,
        hasRated: !!rating,
      });
    } catch (error) {
      console.error('Error fetching ride rating:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener calificación',
      });
    }
  },

  /**
   * Obtener tags disponibles para calificación
   * GET /api/ratings/tags
   */
  async getRatingTags(req, res) {
    try {
      const { type = 'user_to_driver', stars } = req.query;

      const tags = await ratingService.getRatingTags(
        type,
        stars ? parseInt(stars) : null
      );

      res.json({
        success: true,
        tags,
      });
    } catch (error) {
      console.error('Error fetching rating tags:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener tags',
      });
    }
  },

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================

  /**
   * Obtener conductores mejor calificados
   * GET /api/ratings/admin/top-drivers
   */
  async getTopRatedDrivers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const drivers = await ratingService.getTopRatedDrivers(parseInt(limit));

      res.json({
        success: true,
        drivers,
      });
    } catch (error) {
      console.error('Error fetching top drivers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener conductores destacados',
      });
    }
  },

  /**
   * Obtener conductores con baja calificación
   * GET /api/ratings/admin/low-rated
   */
  async getLowRatedDrivers(req, res) {
    try {
      const { threshold = 3.5 } = req.query;
      const drivers = await ratingService.getLowRatedDrivers(parseFloat(threshold));

      res.json({
        success: true,
        drivers,
      });
    } catch (error) {
      console.error('Error fetching low-rated drivers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener conductores',
      });
    }
  },

  /**
   * Obtener calificaciones negativas recientes
   * GET /api/ratings/admin/negative
   */
  async getRecentNegativeRatings(req, res) {
    try {
      const { limit = 20 } = req.query;
      const ratings = await ratingService.getRecentNegativeRatings(parseInt(limit));

      res.json({
        success: true,
        ratings,
      });
    } catch (error) {
      console.error('Error fetching negative ratings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener calificaciones negativas',
      });
    }
  },
};

export default ratingController;
