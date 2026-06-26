import transactionHistoryService from '../services/transactionHistory.service.js';

// @desc    Obtener historial de transacciones con filtros avanzados
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page,
      limit,
      type,
      status,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      referenceType,
      search,
    } = req.query;

    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      status,
      dateFrom,
      dateTo,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      referenceType,
      search,
    };

    const result = await transactionHistoryService.getTransactions(userId, filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones',
      error: error.message,
    });
  }
};

// @desc    Obtener detalle de una transaccion
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await transactionHistoryService.getTransactionById(userId, id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaccion no encontrada',
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error obteniendo transaccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transaccion',
      error: error.message,
    });
  }
};

// @desc    Obtener resumen de transacciones por periodo
// @route   GET /api/transactions/summary
// @access  Private
export const getTransactionsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query; // day, week, month, year

    const summary = await transactionHistoryService.getTransactionsSummary(
      userId,
      period || 'month'
    );

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen de transacciones',
      error: error.message,
    });
  }
};

// @desc    Obtener estadisticas de transacciones
// @route   GET /api/transactions/stats
// @access  Private
export const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await transactionHistoryService.getTransactionStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadisticas',
      error: error.message,
    });
  }
};

// @desc    Exportar historial de transacciones
// @route   GET /api/transactions/export
// @access  Private
export const exportTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { format, dateFrom, dateTo, type, status } = req.query;

    const filters = {
      dateFrom,
      dateTo,
      type,
      status,
    };

    const exportFormat = format || 'csv';
    const result = await transactionHistoryService.exportTransactions(
      userId,
      filters,
      exportFormat
    );

    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=transacciones_${new Date().toISOString().split('T')[0]}.csv`
      );
      // Agregar BOM para UTF-8
      res.send('\ufeff' + result);
    } else if (exportFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=transacciones_${new Date().toISOString().split('T')[0]}.json`
      );
      res.send(result);
    } else {
      res.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error('Error exportando transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando transacciones',
      error: error.message,
    });
  }
};

// @desc    Obtener transacciones por rango de fechas
// @route   GET /api/transactions/range
// @access  Private
export const getTransactionsByRange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren las fechas dateFrom y dateTo',
      });
    }

    const transactions = await transactionHistoryService.getTransactionsByDateRange(
      userId,
      dateFrom,
      dateTo
    );

    res.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error obteniendo transacciones por rango:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones',
      error: error.message,
    });
  }
};
