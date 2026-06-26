import { notificationService } from '../services/notification.service.js';

/**
 * Controller de Notificaciones Push
 */
export const notificationController = {
  /**
   * Registrar token de push notifications
   * POST /api/notifications/token
   */
  async registerToken(req, res) {
    try {
      const userId = req.user.id;
      const { token, platform, deviceId, deviceName, appVersion } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'El token es requerido',
        });
      }

      const result = await notificationService.registerToken(userId, token, {
        platform,
        deviceId,
        deviceName,
        appVersion,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in registerToken:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar token',
      });
    }
  },

  /**
   * Eliminar token de push notifications
   * DELETE /api/notifications/token
   */
  async removeToken(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'El token es requerido',
        });
      }

      const result = await notificationService.removeToken(userId, token);

      res.json(result);
    } catch (error) {
      console.error('Error in removeToken:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar token',
      });
    }
  },

  /**
   * Desactivar todos los tokens del usuario (logout)
   * POST /api/notifications/logout
   */
  async logoutTokens(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.deactivateUserTokens(userId);

      res.json(result);
    } catch (error) {
      console.error('Error in logoutTokens:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar tokens',
      });
    }
  },

  /**
   * Obtener notificaciones del usuario
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await notificationService.getNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json(result);
    } catch (error) {
      console.error('Error in getNotifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
      });
    }
  },

  /**
   * Obtener conteo de notificaciones no leidas
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.getUnreadCount(userId);

      res.json(result);
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conteo',
      });
    }
  },

  /**
   * Marcar notificacion como leida
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await notificationService.markAsRead(id, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar como leida',
      });
    }
  },

  /**
   * Marcar todas las notificaciones como leidas
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json(result);
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar todas como leidas',
      });
    }
  },

  /**
   * Eliminar notificacion
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await notificationService.deleteNotification(id, userId);

      res.json(result);
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar notificacion',
      });
    }
  },

  /**
   * Enviar notificacion de prueba (solo desarrollo)
   * POST /api/notifications/test
   */
  async sendTestNotification(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'No disponible en produccion',
        });
      }

      const userId = req.user.id;
      const { title, body, type } = req.body;

      const result = await notificationService.sendToUser(userId, {
        type: type || 'test',
        title: title || 'Notificacion de prueba',
        body: body || 'Esta es una notificacion de prueba desde VNR',
        data: {
          test: true,
        },
      });

      res.json(result);
    } catch (error) {
      console.error('Error in sendTestNotification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar notificacion de prueba',
      });
    }
  },
};

export default notificationController;
