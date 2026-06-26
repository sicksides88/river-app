import express from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { notificationPreferencesController } from '../controllers/notificationPreferences.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(protect);

// ==========================================
// GESTION DE TOKENS
// ==========================================

// Registrar token de push
router.post('/token', notificationController.registerToken);

// Eliminar token de push
router.delete('/token', notificationController.removeToken);

// Desactivar todos los tokens (logout)
router.post('/logout', notificationController.logoutTokens);

// ==========================================
// PREFERENCIAS DE NOTIFICACIONES
// ==========================================

// Obtener preferencias
router.get('/preferences', notificationPreferencesController.getPreferences);

// Obtener resumen de preferencias para UI
router.get('/preferences/summary', notificationPreferencesController.getPreferencesSummary);

// Actualizar preferencias
router.put('/preferences', notificationPreferencesController.updatePreferences);

// Activar/desactivar categoría específica
router.put('/preferences/category/:category', notificationPreferencesController.toggleCategory);

// Configurar quiet hours
router.put('/preferences/quiet-hours', notificationPreferencesController.setQuietHours);

// Activar/desactivar sonido
router.put('/preferences/sound', notificationPreferencesController.toggleSound);

// Activar/desactivar vibración
router.put('/preferences/vibration', notificationPreferencesController.toggleVibration);

// Restablecer preferencias a valores por defecto
router.post('/preferences/reset', notificationPreferencesController.resetToDefaults);

// ==========================================
// NOTIFICACIONES
// ==========================================

// Obtener notificaciones (paginado)
router.get('/', notificationController.getNotifications);

// Obtener conteo de no leidas
router.get('/unread-count', notificationController.getUnreadCount);

// Marcar todas como leidas
router.put('/read-all', notificationController.markAllAsRead);

// Marcar una como leida
router.put('/:id/read', notificationController.markAsRead);

// Eliminar notificacion
router.delete('/:id', notificationController.deleteNotification);

// ==========================================
// DESARROLLO
// ==========================================

// Enviar notificacion de prueba (solo dev)
router.post('/test', notificationController.sendTestNotification);

export default router;
