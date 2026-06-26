import express from 'express';
import ratingController from '../controllers/rating.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// ==========================================
// RUTAS PÚBLICAS (usuarios autenticados)
// ==========================================

// Tags para calificaciones
router.get('/tags', ratingController.getRatingTags);

// Mis calificaciones
router.get('/me', ratingController.getMyRatings);
router.get('/me/stats', ratingController.getMyRatingStats);

// Verificar si puedo calificar
router.get('/can-rate/ride/:rideId', ratingController.canRateRide);

// Obtener calificación de un viaje
router.get('/ride/:rideId', ratingController.getRideRating);

// Crear calificaciones
router.post('/ride', ratingController.createRideRating);
router.post('/delivery', ratingController.createDeliveryRating);

// Ver calificaciones de otro usuario (público)
router.get('/user/:userId', ratingController.getUserRatings);
router.get('/user/:userId/stats', ratingController.getUserRatingStats);

// ==========================================
// RUTAS DE ADMIN
// ==========================================

router.get('/admin/top-drivers', authorize('admin'), ratingController.getTopRatedDrivers);
router.get('/admin/low-rated', authorize('admin'), ratingController.getLowRatedDrivers);
router.get('/admin/negative', authorize('admin'), ratingController.getRecentNegativeRatings);

export default router;
