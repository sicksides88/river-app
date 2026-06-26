import { supabaseAdmin } from '../config/supabase.js';

/**
 * Servicio de Historial de Transacciones
 * Proporciona funcionalidades avanzadas para consultar y exportar transacciones
 */
export const transactionHistoryService = {
  /**
   * Obtener transacciones con filtros avanzados y paginacion
   * @param {string} userId - ID del usuario
   * @param {Object} filters - Filtros de busqueda
   * @param {number} filters.page - Numero de pagina (default: 1)
   * @param {number} filters.limit - Registros por pagina (default: 20)
   * @param {string} filters.type - Tipo de transaccion (deposit, withdrawal, payment, refund, bonus)
   * @param {string} filters.status - Estado de la transaccion (pending, completed, failed, cancelled)
   * @param {string} filters.dateFrom - Fecha inicio (ISO string)
   * @param {string} filters.dateTo - Fecha fin (ISO string)
   * @param {number} filters.minAmount - Monto minimo
   * @param {number} filters.maxAmount - Monto maximo
   * @param {string} filters.referenceType - Tipo de referencia (ride, delivery, mercadopago, bank_transfer)
   * @param {string} filters.search - Busqueda en descripcion
   */
  async getTransactions(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        referenceType,
        search,
      } = filters;

      const offset = (page - 1) * limit;

      // Construir query base
      let query = supabaseAdmin
        .from('wallet_transactions')
        .select(`
          *,
          payments:payment_id (
            id,
            payment_method,
            mp_payment_id,
            status
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      if (minAmount !== undefined && minAmount !== null) {
        query = query.gte('amount', minAmount);
      }

      if (maxAmount !== undefined && maxAmount !== null) {
        query = query.lte('amount', maxAmount);
      }

      if (referenceType) {
        query = query.eq('reference_type', referenceType);
      }

      if (search) {
        query = query.ilike('description', `%${search}%`);
      }

      // Aplicar paginacion
      query = query.range(offset, offset + limit - 1);

      const { data: transactions, error, count } = await query;

      if (error) throw error;

      // Enriquecer transacciones con informacion de referencia
      const enrichedTransactions = await this.enrichTransactions(transactions);

      return {
        transactions: enrichedTransactions,
        total: count,
        page,
        pages: Math.ceil(count / limit),
        hasMore: offset + transactions.length < count,
      };
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      throw error;
    }
  },

  /**
   * Enriquecer transacciones con informacion de viajes/envios
   */
  async enrichTransactions(transactions) {
    if (!transactions || transactions.length === 0) return [];

    const enriched = await Promise.all(
      transactions.map(async (tx) => {
        let referenceDetails = null;

        if (tx.reference_type === 'ride' && tx.reference_id) {
          const { data: ride } = await supabaseAdmin
            .from('rides')
            .select('id, pickup_address, dropoff_address, distance, estimated_price, status')
            .eq('id', tx.reference_id)
            .single();

          if (ride) {
            referenceDetails = {
              ...ride,
              origin_address: ride.pickup_address,
              destination_address: ride.dropoff_address,
            };
          }
        } else if (tx.reference_type === 'delivery' && tx.reference_id) {
          const { data: delivery } = await supabaseAdmin
            .from('deliveries')
            .select('id, pickup_address, dropoff_address, package_description, estimated_price, status')
            .eq('id', tx.reference_id)
            .single();

          if (delivery) {
            referenceDetails = {
              ...delivery,
              delivery_address: delivery.dropoff_address,
            };
          }
        }

        return {
          ...tx,
          referenceDetails,
        };
      })
    );

    return enriched;
  },

  /**
   * Obtener transaccion por ID con detalles completos
   */
  async getTransactionById(userId, transactionId) {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select(`
          *,
          payments:payment_id (
            id,
            payment_method,
            mp_payment_id,
            mp_preference_id,
            status,
            paid_at
          )
        `)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Enriquecer con detalles de referencia
      let referenceDetails = null;

      if (transaction.reference_type === 'ride' && transaction.reference_id) {
        const { data: ride } = await supabaseAdmin
          .from('rides')
          .select(`
            id,
            pickup_address,
            pickup_lat,
            pickup_lng,
            dropoff_address,
            dropoff_lat,
            dropoff_lng,
            distance,
            duration,
            estimated_price,
            actual_price,
            status,
            created_at,
            driver:driver_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('id', transaction.reference_id)
          .single();

        // Mapear a nombres mas descriptivos para el frontend
        if (ride) {
          referenceDetails = {
            ...ride,
            origin_address: ride.pickup_address,
            destination_address: ride.dropoff_address,
          };
        }
      } else if (transaction.reference_type === 'delivery' && transaction.reference_id) {
        const { data: delivery } = await supabaseAdmin
          .from('deliveries')
          .select(`
            id,
            pickup_address,
            dropoff_address,
            package_description,
            estimated_price,
            status,
            created_at,
            driver:driver_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('id', transaction.reference_id)
          .single();

        if (delivery) {
          referenceDetails = {
            ...delivery,
            delivery_address: delivery.dropoff_address,
          };
        }
      }

      return {
        ...transaction,
        referenceDetails,
      };
    } catch (error) {
      console.error('Error obteniendo transaccion:', error);
      throw error;
    }
  },

  /**
   * Obtener transacciones por rango de fechas
   */
  async getTransactionsByDateRange(userId, dateFrom, dateTo) {
    try {
      const { data: transactions, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return transactions;
    } catch (error) {
      console.error('Error obteniendo transacciones por fecha:', error);
      throw error;
    }
  },

  /**
   * Obtener resumen de transacciones por periodo
   * @param {string} userId - ID del usuario
   * @param {string} period - Periodo: 'day', 'week', 'month', 'year'
   */
  async getTransactionsSummary(userId, period = 'month') {
    try {
      // Calcular fechas del periodo
      const now = new Date();
      let dateFrom;

      switch (period) {
        case 'day':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - dayOfWeek);
          dateFrom.setHours(0, 0, 0, 0);
          break;
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const { data: transactions, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('type, amount, status')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', dateFrom.toISOString());

      if (error) throw error;

      // Calcular resumen
      const summary = {
        period,
        periodStart: dateFrom.toISOString(),
        periodEnd: now.toISOString(),
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalRefunds: 0,
        totalBonuses: 0,
        netBalance: 0,
        transactionCount: transactions.length,
        breakdown: {
          deposit: { count: 0, total: 0 },
          withdrawal: { count: 0, total: 0 },
          payment: { count: 0, total: 0 },
          refund: { count: 0, total: 0 },
          bonus: { count: 0, total: 0 },
        },
      };

      transactions.forEach((tx) => {
        const amount = parseFloat(tx.amount);
        const absAmount = Math.abs(amount);

        summary.breakdown[tx.type] = summary.breakdown[tx.type] || { count: 0, total: 0 };
        summary.breakdown[tx.type].count++;
        summary.breakdown[tx.type].total += absAmount;

        switch (tx.type) {
          case 'deposit':
            summary.totalDeposits += absAmount;
            summary.netBalance += absAmount;
            break;
          case 'withdrawal':
            summary.totalWithdrawals += absAmount;
            summary.netBalance -= absAmount;
            break;
          case 'payment':
            summary.totalPayments += absAmount;
            summary.netBalance -= absAmount;
            break;
          case 'refund':
            summary.totalRefunds += absAmount;
            summary.netBalance += absAmount;
            break;
          case 'bonus':
            summary.totalBonuses += absAmount;
            summary.netBalance += absAmount;
            break;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error obteniendo resumen de transacciones:', error);
      throw error;
    }
  },

  /**
   * Exportar transacciones a formato CSV
   */
  async exportTransactions(userId, filters = {}, format = 'csv') {
    try {
      // Obtener todas las transacciones sin paginacion
      const { dateFrom, dateTo, type, status } = filters;

      let query = supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      if (format === 'csv') {
        return this.generateCSV(transactions);
      } else if (format === 'json') {
        return JSON.stringify(transactions, null, 2);
      }

      return transactions;
    } catch (error) {
      console.error('Error exportando transacciones:', error);
      throw error;
    }
  },

  /**
   * Generar CSV de transacciones
   */
  generateCSV(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'No hay transacciones para exportar';
    }

    const headers = [
      'ID',
      'Fecha',
      'Tipo',
      'Descripcion',
      'Monto',
      'Saldo Anterior',
      'Saldo Posterior',
      'Estado',
      'Referencia',
    ];

    const typeLabels = {
      deposit: 'Recarga',
      withdrawal: 'Retiro',
      payment: 'Pago',
      refund: 'Reembolso',
      bonus: 'Bonificacion',
    };

    const statusLabels = {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      cancelled: 'Cancelado',
    };

    const rows = transactions.map((tx) => [
      tx.id,
      new Date(tx.created_at).toLocaleString('es-AR'),
      typeLabels[tx.type] || tx.type,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount,
      tx.balance_before,
      tx.balance_after,
      statusLabels[tx.status] || tx.status,
      tx.reference_type || '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csvContent;
  },

  /**
   * Obtener estadisticas de transacciones
   */
  async getTransactionStats(userId) {
    try {
      const { data: transactions, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('type, amount, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const last30Days = transactions.filter(
        (tx) => new Date(tx.created_at) >= thirtyDaysAgo
      );

      const stats = {
        allTime: {
          totalTransactions: transactions.length,
          totalDeposited: 0,
          totalSpent: 0,
          averageTransaction: 0,
        },
        last30Days: {
          totalTransactions: last30Days.length,
          totalDeposited: 0,
          totalSpent: 0,
          averageTransaction: 0,
        },
        mostFrequentType: null,
        largestTransaction: null,
      };

      // Calcular estadisticas all-time
      const typeCounts = {};
      let maxAmount = 0;
      let largestTx = null;

      transactions.forEach((tx) => {
        const amount = parseFloat(tx.amount);
        const absAmount = Math.abs(amount);

        typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1;

        if (absAmount > maxAmount) {
          maxAmount = absAmount;
          largestTx = tx;
        }

        if (tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'bonus') {
          stats.allTime.totalDeposited += absAmount;
        } else {
          stats.allTime.totalSpent += absAmount;
        }
      });

      // Calcular estadisticas ultimos 30 dias
      last30Days.forEach((tx) => {
        const absAmount = Math.abs(parseFloat(tx.amount));
        if (tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'bonus') {
          stats.last30Days.totalDeposited += absAmount;
        } else {
          stats.last30Days.totalSpent += absAmount;
        }
      });

      // Promedios
      if (transactions.length > 0) {
        const totalAmount = transactions.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);
        stats.allTime.averageTransaction = totalAmount / transactions.length;
      }

      if (last30Days.length > 0) {
        const totalAmount = last30Days.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);
        stats.last30Days.averageTransaction = totalAmount / last30Days.length;
      }

      // Tipo mas frecuente
      const maxType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      stats.mostFrequentType = maxType ? { type: maxType[0], count: maxType[1] } : null;
      stats.largestTransaction = largestTx;

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadisticas:', error);
      throw error;
    }
  },
};

export default transactionHistoryService;
