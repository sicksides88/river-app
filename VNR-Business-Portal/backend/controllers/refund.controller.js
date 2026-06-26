import refundService from '../services/refund.service.js';

// =====================================================
// SOLICITUDES DE REEMBOLSO (Usuario)
// =====================================================

// @desc    Solicitar reembolso
// @route   POST /api/refunds
// @access  Private
export const requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId, rideId, deliveryId, reason, reasonDetails } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere paymentId',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el motivo',
      });
    }

    const result = await refundService.requestRefund({
      userId,
      paymentId,
      rideId,
      deliveryId,
      reason,
      reasonDetails,
      requestedBy: 'user',
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error solicitando reembolso:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error solicitando reembolso',
    });
  }
};

// @desc    Obtener mis reembolsos
// @route   GET /api/refunds
// @access  Private
export const getMyRefunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, status } = req.query;

    const result = await refundService.getUserRefunds(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo reembolsos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo reembolsos',
      error: error.message,
    });
  }
};

// @desc    Obtener detalle de reembolso
// @route   GET /api/refunds/:id
// @access  Private
export const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const refund = await refundService.getRefundById(id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Reembolso no encontrado',
      });
    }

    // Verificar que el reembolso pertenece al usuario (o es admin)
    if (refund.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    res.json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error('Error obteniendo reembolso:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo reembolso',
      error: error.message,
    });
  }
};

// @desc    Cancelar solicitud de reembolso
// @route   PUT /api/refunds/:id/cancel
// @access  Private
export const cancelRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await refundService.cancelRefund(id, userId);

    res.json(result);
  } catch (error) {
    console.error('Error cancelando reembolso:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelando reembolso',
    });
  }
};

// @desc    Calcular monto de reembolso (preview)
// @route   POST /api/refunds/calculate
// @access  Private
export const calculateRefund = async (req, res) => {
  try {
    const { originalAmount, reason } = req.body;

    if (!originalAmount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere originalAmount y reason',
      });
    }

    const calculation = await refundService.calculateRefundAmount(originalAmount, reason);

    res.json({
      success: true,
      calculation,
    });
  } catch (error) {
    console.error('Error calculando reembolso:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculando reembolso',
      error: error.message,
    });
  }
};

// @desc    Obtener políticas de reembolso
// @route   GET /api/refunds/policies
// @access  Private
export const getRefundPolicies = async (req, res) => {
  try {
    const policies = await refundService.getAllPolicies();

    res.json({
      success: true,
      policies,
    });
  } catch (error) {
    console.error('Error obteniendo políticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo políticas',
      error: error.message,
    });
  }
};

// =====================================================
// ADMINISTRACIÓN DE REEMBOLSOS (Admin)
// =====================================================

// @desc    Obtener reembolsos pendientes
// @route   GET /api/refunds/admin/pending
// @access  Private (Admin)
export const getPendingRefunds = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await refundService.getPendingRefunds({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo reembolsos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo reembolsos pendientes',
      error: error.message,
    });
  }
};

// @desc    Aprobar reembolso
// @route   PUT /api/refunds/:id/approve
// @access  Private (Admin)
export const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await refundService.approveRefund(id, adminId);

    res.json(result);
  } catch (error) {
    console.error('Error aprobando reembolso:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error aprobando reembolso',
    });
  }
};

// @desc    Rechazar reembolso
// @route   PUT /api/refunds/:id/reject
// @access  Private (Admin)
export const rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el motivo del rechazo',
      });
    }

    const result = await refundService.rejectRefund(id, adminId, rejectionReason);

    res.json(result);
  } catch (error) {
    console.error('Error rechazando reembolso:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error rechazando reembolso',
    });
  }
};

// @desc    Obtener estadísticas de reembolsos
// @route   GET /api/refunds/admin/stats
// @access  Private (Admin)
export const getRefundStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await refundService.getRefundStats({ dateFrom, dateTo });

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};
