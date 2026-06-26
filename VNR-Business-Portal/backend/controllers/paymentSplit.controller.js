import paymentSplitService from '../services/paymentSplit.service.js';

// =====================================================
// DIVISIÓN DE PAGOS
// =====================================================

// @desc    Calcular división de pago (preview)
// @route   POST /api/payment-splits/calculate
// @access  Private
export const calculateSplit = async (req, res) => {
  try {
    const { amount, serviceType } = req.body;

    if (!amount || !serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere amount y serviceType',
      });
    }

    const split = await paymentSplitService.calculateSplit(amount, serviceType);

    res.json({
      success: true,
      split,
    });
  } catch (error) {
    console.error('Error calculando división:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculando división',
      error: error.message,
    });
  }
};

// @desc    Obtener división por ID de pago
// @route   GET /api/payment-splits/payment/:paymentId
// @access  Private
export const getSplitByPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const split = await paymentSplitService.getSplitByPayment(paymentId);

    if (!split) {
      return res.status(404).json({
        success: false,
        message: 'División no encontrada',
      });
    }

    res.json({
      success: true,
      split,
    });
  } catch (error) {
    console.error('Error obteniendo división:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo división',
      error: error.message,
    });
  }
};

// @desc    Obtener divisiones del conductor actual
// @route   GET /api/payment-splits/driver
// @access  Private (Driver)
export const getDriverSplits = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { page, limit, dateFrom, dateTo, serviceType } = req.query;

    const result = await paymentSplitService.getDriverSplits(driverId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      dateFrom,
      dateTo,
      serviceType,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo divisiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo divisiones',
      error: error.message,
    });
  }
};

// =====================================================
// CONFIGURACIÓN DE COMISIONES
// =====================================================

// @desc    Obtener tasa de comisión por servicio
// @route   GET /api/payment-splits/commission/:serviceType
// @access  Private
export const getCommissionRate = async (req, res) => {
  try {
    const { serviceType } = req.params;

    const commission = await paymentSplitService.getCommissionRate(serviceType);

    res.json({
      success: true,
      commission,
    });
  } catch (error) {
    console.error('Error obteniendo comisión:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comisión',
      error: error.message,
    });
  }
};

// @desc    Obtener todas las configuraciones de comisión
// @route   GET /api/payment-splits/commissions
// @access  Private
export const getAllCommissions = async (req, res) => {
  try {
    const settings = await paymentSplitService.getAllCommissionSettings();

    res.json({
      success: true,
      commissions: settings,
    });
  } catch (error) {
    console.error('Error obteniendo comisiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comisiones',
      error: error.message,
    });
  }
};

// @desc    Actualizar configuración de comisión (Admin)
// @route   PUT /api/payment-splits/commission/:serviceType
// @access  Private (Admin)
export const updateCommission = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { platformPercentage, driverPercentage, minPlatformFee, maxPlatformFee } = req.body;

    // Validaciones
    if (platformPercentage === undefined || driverPercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere platformPercentage y driverPercentage',
      });
    }

    if (platformPercentage + driverPercentage !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Los porcentajes deben sumar 100%',
      });
    }

    const result = await paymentSplitService.updateCommissionSetting(serviceType, {
      platformPercentage,
      driverPercentage,
      minPlatformFee,
      maxPlatformFee,
    });

    res.json({
      success: true,
      message: 'Configuración actualizada',
      ...result,
    });
  } catch (error) {
    console.error('Error actualizando comisión:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error actualizando comisión',
    });
  }
};

// =====================================================
// PROPINAS
// =====================================================

// @desc    Enviar propina
// @route   POST /api/payment-splits/tip
// @access  Private
export const sendTip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rideId, deliveryId, amount, percentage, message } = req.body;

    if (!rideId && !deliveryId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere rideId o deliveryId',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0',
      });
    }

    const result = await paymentSplitService.addTip({
      rideId,
      deliveryId,
      userId,
      amount,
      percentage,
      message,
      paymentMethod: 'wallet',
    });

    res.json({
      success: true,
      message: 'Propina enviada correctamente',
      tip: result.tip,
    });
  } catch (error) {
    console.error('Error enviando propina:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error enviando propina',
    });
  }
};

// @desc    Obtener propinas recibidas (conductor)
// @route   GET /api/payment-splits/tips
// @access  Private (Driver)
export const getDriverTips = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { page, limit } = req.query;

    const result = await paymentSplitService.getDriverTips(driverId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo propinas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo propinas',
      error: error.message,
    });
  }
};

// =====================================================
// REPORTES (Admin)
// =====================================================

// @desc    Obtener resumen de ganancias de plataforma
// @route   GET /api/payment-splits/platform-summary
// @access  Private (Admin)
export const getPlatformSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo, serviceType } = req.query;

    const summary = await paymentSplitService.getPlatformEarningsSummary({
      dateFrom,
      dateTo,
      serviceType,
    });

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen',
      error: error.message,
    });
  }
};
