/**
 * Maps Routes
 * Google Maps API proxy endpoints
 */

import { Router } from 'express';
import mapsController from '../controllers/maps.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Places/Geocoding API - PÚBLICAS: se usan en el registro de comercios
// (sin login todavía). Solo proxean Google, no exponen datos sensibles.
router.get('/places/search', mapsController.searchPlaces);
router.get('/places/:placeId', mapsController.getPlaceDetails);
router.get('/geocode', mapsController.geocode);
router.get('/reverse-geocode', mapsController.reverseGeocode);

// El resto requiere autenticación
router.post('/directions', protect, mapsController.getDirections);
router.post('/distance-matrix', protect, mapsController.getDistanceMatrix);
router.post('/eta', protect, mapsController.calculateETA);

export default router;
