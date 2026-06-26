import { notificationPreferencesService } from '../services/notificationPreferences.service.js';

/**
 * Controller de Preferencias de Notificaciones
 */
export const notificationPreferencesController = {
  /**
   * Obtener preferencias del usuario
   * GET /api/notifications/preferences
   */
  async getPreferences(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationPreferencesService.getPreferences(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getPreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener preferencias',
      });
    }
  },

  /**
   * Obtener resumen de preferencias para UI
   * GET /api/notifications/preferences/summary
   */
  async getPreferencesSummary(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationPreferencesService.getPreferencesSummary(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getPreferencesSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de preferencias',
      });
    }
  },

  /**
   * Actualizar preferencias
   * PUT /api/notifications/preferences
   */
  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const result = await notificationPreferencesService.updatePreferences(userId, updates);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar preferencias',
      });
    }
  },

  /**
   * Activar/desactivar categoría
   * PUT /api/notifications/preferences/category/:category
   */
  async toggleCategory(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "enabled" es requerido y debe ser booleano',
        });
      }

      const result = await notificationPreferencesService.toggleCategory(userId, category, enabled);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in toggleCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de categoría',
      });
    }
  },

  /**
   * Configurar quiet hours
   * PUT /api/notifications/preferences/quiet-hours
   */
  async setQuietHours(req, res) {
    try {
      const userId = req.user.id;
      const { enabled, startTime, endTime } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "enabled" es requerido y debe ser booleano',
        });
      }

      const result = await notificationPreferencesService.setQuietHours(
        userId,
        enabled,
        startTime,
        endTime
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in setQuietHours:', error);
      res.status(500).json({
        success: false,
        message: 'Error al configurar horario silencioso',
      });
    }
  },

  /**
   * Activar/desactivar sonido
   * PUT /api/notifications/preferences/sound
   */
  async toggleSound(req, res) {
    try {
      const userId = req.user.id;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "enabled" es requerido y debe ser booleano',
        });
      }

      const result = await notificationPreferencesService.updatePreferences(userId, {
        sound_enabled: enabled,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in toggleSound:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar configuración de sonido',
      });
    }
  },

  /**
   * Activar/desactivar vibración
   * PUT /api/notifications/preferences/vibration
   */
  async toggleVibration(req, res) {
    try {
      const userId = req.user.id;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "enabled" es requerido y debe ser booleano',
        });
      }

      const result = await notificationPreferencesService.updatePreferences(userId, {
        vibration_enabled: enabled,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in toggleVibration:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar configuración de vibración',
      });
    }
  },

  /**
   * Restablecer preferencias a valores por defecto
   * POST /api/notifications/preferences/reset
   */
  async resetToDefaults(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationPreferencesService.resetToDefaults(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        ...result,
        message: 'Preferencias restablecidas a valores por defecto',
      });
    } catch (error) {
      console.error('Error in resetToDefaults:', error);
      res.status(500).json({
        success: false,
        message: 'Error al restablecer preferencias',
      });
    }
  },
};

export default notificationPreferencesController;
