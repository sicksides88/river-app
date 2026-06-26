import driverWalletService from '../services/driverWallet.service.js';

// @desc    Obtener wallet del conductor
// @route   GET /api/driver/wallet
// @access  Private (Driver)
export const getWallet = async (req, res) => {
  try {
    const driverId = req.user.id;
    const wallet = await driverWalletService.getWallet(driverId);

    const availableBalance = parseFloat(wallet.available_balance);
    // Si el balance es negativo, es lo que debe de comisión por cobros en efectivo
    const commissionOwed = availableBalance < 0 ? Math.abs(availableBalance) : 0;

    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        availableBalance,
        pendingBalance: parseFloat(wallet.pending_balance),
        totalEarned: parseFloat(wallet.total_earned),
        commissionOwed,
        currency: wallet.currency,
        isActive: wallet.is_active,
        isBlocked: wallet.is_blocked,
        blockedReason: wallet.blocked_reason,
      },
    });
  } catch (error) {
    console.error('Error obteniendo driver wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo wallet',
      error: error.message,
    });
  }
};

// @desc    Obtener saldos del conductor
// @route   GET /api/driver/wallet/balance
// @access  Private (Driver)
export const getBalance = async (req, res) => {
  try {
    const balance = await driverWalletService.getBalance(req.user.id);

    res.json({
      success: true,
      ...balance,
    });
  } catch (error) {
    console.error('Error obteniendo saldo conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo saldo',
      error: error.message,
    });
  }
};

// @desc    Obtener historial de ganancias
// @route   GET /api/driver/wallet/earnings
// @access  Private (Driver)
export const getEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const period = req.query.period;

    const result = await driverWalletService.getEarnings(driverId, {
      page,
      limit,
      status,
      period,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo ganancias:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ganancias',
      error: error.message,
    });
  }
};

// @desc    Obtener ganancias del dia
// @route   GET /api/driver/wallet/earnings/today
// @access  Private (Driver)
export const getTodayEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const summary = await driverWalletService.getEarningsSummary(driverId, 'today');

    // Obtener tiempo conectado del dia
    const connectedMinutes = await driverWalletService.getConnectedTime(driverId, 'today');

    // Obtener puntos del conductor
    const points = await driverWalletService.getDriverPoints(driverId);

    res.json({
      success: true,
      // Formato esperado por el frontend
      total: summary.totalNet,
      trips: summary.tripCount,
      points: points,
      connectedMinutes: connectedMinutes,
      // Datos adicionales para detalle
      totalGross: summary.totalGross,
      totalNet: summary.totalNet,
      totalTips: summary.totalTips,
      totalFees: summary.totalFees,
      period: summary.period,
    });
  } catch (error) {
    console.error('Error obteniendo ganancias del dia:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ganancias del dia',
      error: error.message,
    });
  }
};

// @desc    Obtener ganancias de la semana
// @route   GET /api/driver/wallet/earnings/week
// @access  Private (Driver)
export const getWeekEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const summary = await driverWalletService.getEarningsSummary(driverId, 'week');

    // Obtener tiempo conectado de la semana
    const connectedMinutes = await driverWalletService.getConnectedTime(driverId, 'week');

    // Obtener puntos del conductor
    const points = await driverWalletService.getDriverPoints(driverId);

    res.json({
      success: true,
      // Formato esperado por el frontend
      total: summary.totalNet,
      trips: summary.tripCount,
      points: points,
      connectedMinutes: connectedMinutes,
      // Datos adicionales para detalle
      totalGross: summary.totalGross,
      totalNet: summary.totalNet,
      totalTips: summary.totalTips,
      totalFees: summary.totalFees,
      period: summary.period,
    });
  } catch (error) {
    console.error('Error obteniendo ganancias de la semana:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ganancias de la semana',
      error: error.message,
    });
  }
};

// @desc    Obtener ganancias del mes
// @route   GET /api/driver/wallet/earnings/month
// @access  Private (Driver)
export const getMonthEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const summary = await driverWalletService.getEarningsSummary(driverId, 'month');

    // Obtener tiempo conectado del mes
    const connectedMinutes = await driverWalletService.getConnectedTime(driverId, 'month');

    // Obtener puntos del conductor
    const points = await driverWalletService.getDriverPoints(driverId);

    res.json({
      success: true,
      // Formato esperado por el frontend
      total: summary.totalNet,
      trips: summary.tripCount,
      points: points,
      connectedMinutes: connectedMinutes,
      // Datos adicionales para detalle
      totalGross: summary.totalGross,
      totalNet: summary.totalNet,
      totalTips: summary.totalTips,
      totalFees: summary.totalFees,
      period: summary.period,
    });
  } catch (error) {
    console.error('Error obteniendo ganancias del mes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ganancias del mes',
      error: error.message,
    });
  }
};

// @desc    Solicitar retiro
// @route   POST /api/driver/wallet/withdraw
// @access  Private (Driver)
export const requestWithdrawal = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { amount, bankAccountId } = req.body;

    if (!amount || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Monto minimo de retiro: $1,000',
      });
    }

    if (!bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una cuenta bancaria',
      });
    }

    const withdrawal = await driverWalletService.requestWithdrawal(
      driverId,
      amount,
      bankAccountId
    );

    res.status(201).json({
      success: true,
      message: 'Solicitud de retiro creada',
      ...withdrawal,
    });
  } catch (error) {
    console.error('Error solicitando retiro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error solicitando retiro',
    });
  }
};

// @desc    Obtener historial de retiros
// @route   GET /api/driver/wallet/withdrawals
// @access  Private (Driver)
export const getWithdrawals = async (req, res) => {
  try {
    const driverId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const result = await driverWalletService.getWithdrawals(driverId, {
      page,
      limit,
      status,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo retiros:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo retiros',
      error: error.message,
    });
  }
};

// @desc    Liberar ganancias pendientes (Job - solo admin/sistema)
// @route   POST /api/driver/wallet/release-earnings
// @access  Private (Admin)
export const releaseEarnings = async (req, res) => {
  try {
    const result = await driverWalletService.processEarningRelease();

    res.json({
      success: true,
      message: `${result.processed} ganancias procesadas`,
      ...result,
    });
  } catch (error) {
    console.error('Error liberando ganancias:', error);
    res.status(500).json({
      success: false,
      message: 'Error liberando ganancias',
      error: error.message,
    });
  }
};
