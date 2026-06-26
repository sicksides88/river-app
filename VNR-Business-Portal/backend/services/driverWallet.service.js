import { supabaseAdmin } from '../config/supabase.js';

/**
 * Servicio de Wallet para conductores
 */
export const driverWalletService = {
  /**
   * Obtener wallet del conductor (o crear si no existe)
   */
  async getWallet(driverId) {
    try {
      let { data: wallet, error } = await supabaseAdmin
        .from('driver_wallets')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (error && error.code === 'PGRST116') {
        wallet = await this.createWallet(driverId);
      } else if (error) {
        throw error;
      }

      return wallet;
    } catch (error) {
      console.error('Error obteniendo driver wallet:', error);
      throw error;
    }
  },

  /**
   * Crear wallet para un conductor
   */
  async createWallet(driverId) {
    try {
      const { data: wallet, error } = await supabaseAdmin
        .from('driver_wallets')
        .insert({
          driver_id: driverId,
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          currency: 'ARS',
        })
        .select()
        .single();

      if (error) throw error;
      return wallet;
    } catch (error) {
      console.error('Error creando driver wallet:', error);
      throw error;
    }
  },

  /**
   * Obtener saldos del conductor
   */
  async getBalance(driverId) {
    try {
      const wallet = await this.getWallet(driverId);
      return {
        availableBalance: parseFloat(wallet.available_balance),
        pendingBalance: parseFloat(wallet.pending_balance),
        totalEarned: parseFloat(wallet.total_earned),
        currency: wallet.currency,
        isActive: wallet.is_active,
      };
    } catch (error) {
      console.error('Error obteniendo saldo conductor:', error);
      throw error;
    }
  },

  /**
   * Agregar ganancia por un viaje/envio completado
   */
  async addEarning(data) {
    const {
      driverId,
      rideId,
      deliveryId,
      paymentId,
      grossAmount,
      serviceType,
      paymentMethod,
    } = data;

    try {
      // Idempotencia: verificar si ya existe earning para este payment
      if (paymentId) {
        const { data: existingEarning } = await supabaseAdmin
          .from('driver_earnings')
          .select('id')
          .eq('payment_id', paymentId)
          .single();

        if (existingEarning) {
          console.log(`[Wallet] Ya existe earning para payment ${paymentId}, omitiendo duplicado`);
          return { success: true, earning: existingEarning, duplicate: true };
        }
      }

      const wallet = await this.getWallet(driverId);

      // Obtener configuracion de comision para este tipo de servicio
      const { data: commission } = await supabaseAdmin
        .from('commission_settings')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .single();

      // Calcular comisiones (default: 20% plataforma, 80% conductor)
      const platformPercentage = commission?.platform_percentage || 20;
      const platformFee = Math.max(
        (grossAmount * platformPercentage) / 100,
        commission?.min_platform_fee || 50
      );
      const netAmount = grossAmount - platformFee;

      const isCash = paymentMethod === 'cash';

      // Fecha de disponibilidad (72 horas despues para pagos digitales, inmediato para efectivo)
      const availableAt = new Date();
      if (!isCash) {
        availableAt.setHours(availableAt.getHours() + 72);
      }

      // Registrar ganancia
      const { data: earning, error: earningError } = await supabaseAdmin
        .from('driver_earnings')
        .insert({
          driver_id: driverId,
          wallet_id: wallet.id,
          ride_id: rideId,
          delivery_id: deliveryId,
          payment_id: paymentId,
          gross_amount: grossAmount,
          platform_fee: platformFee,
          net_amount: netAmount,
          status: isCash ? 'cash_collected' : 'pending',
          available_at: availableAt.toISOString(),
        })
        .select()
        .single();

      if (earningError) throw earningError;

      if (isCash) {
        // Pago en efectivo: el conductor ya cobró el dinero en mano
        // Generar saldo a abonar al sistema (solo la comisión de VNR)
        const newAvailableBalance = parseFloat(wallet.available_balance) - platformFee;
        const newTotalEarned = parseFloat(wallet.total_earned) + netAmount;

        await supabaseAdmin
          .from('driver_wallets')
          .update({
            available_balance: newAvailableBalance,
            total_earned: newTotalEarned,
          })
          .eq('id', wallet.id);

        console.log(`[Wallet] Pago efectivo - Comisión VNR: $${platformFee} → Saldo a abonar: $${Math.abs(newAvailableBalance)}`);
      } else {
        // Pago digital: agregar al saldo pendiente (se libera en 72h)
        const newPendingBalance = parseFloat(wallet.pending_balance) + netAmount;
        const newTotalEarned = parseFloat(wallet.total_earned) + netAmount;

        await supabaseAdmin
          .from('driver_wallets')
          .update({
            pending_balance: newPendingBalance,
            total_earned: newTotalEarned,
          })
          .eq('id', wallet.id);
      }

      return {
        success: true,
        earningId: earning.id,
        grossAmount,
        platformFee,
        netAmount,
        availableAt,
        isCash,
      };
    } catch (error) {
      console.error('Error agregando ganancia:', error);
      throw error;
    }
  },

  /**
   * Liberar fondos pendientes que ya cumplieron el periodo de retencion
   * (Este metodo deberia ser llamado por un cron job)
   */
  async processEarningRelease() {
    try {
      const now = new Date().toISOString();

      // Obtener ganancias pendientes que ya pasaron su fecha de disponibilidad
      const { data: pendingEarnings, error: fetchError } = await supabaseAdmin
        .from('driver_earnings')
        .select('*')
        .eq('status', 'pending')
        .lte('available_at', now);

      if (fetchError) throw fetchError;

      const results = [];

      for (const earning of pendingEarnings) {
        try {
          // Obtener wallet del conductor
          const { data: wallet } = await supabaseAdmin
            .from('driver_wallets')
            .select('*')
            .eq('id', earning.wallet_id)
            .single();

          if (!wallet) continue;

          const netAmount = parseFloat(earning.net_amount);
          const newAvailable = parseFloat(wallet.available_balance) + netAmount;
          const newPending = parseFloat(wallet.pending_balance) - netAmount;

          // Actualizar wallet
          await supabaseAdmin
            .from('driver_wallets')
            .update({
              available_balance: newAvailable,
              pending_balance: Math.max(0, newPending),
            })
            .eq('id', wallet.id);

          // Actualizar estado de la ganancia
          await supabaseAdmin
            .from('driver_earnings')
            .update({
              status: 'available',
            })
            .eq('id', earning.id);

          results.push({
            earningId: earning.id,
            driverId: earning.driver_id,
            amount: netAmount,
            status: 'released',
          });
        } catch (err) {
          console.error(`Error liberando ganancia ${earning.id}:`, err);
          results.push({
            earningId: earning.id,
            status: 'error',
            error: err.message,
          });
        }
      }

      return {
        processed: results.length,
        results,
      };
    } catch (error) {
      console.error('Error procesando liberacion de fondos:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de ganancias
   */
  async getEarnings(driverId, options = {}) {
    try {
      const { page = 1, limit = 20, status, period } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('driver_earnings')
        .select(`
          *,
          ride:ride_id(id, pickup_address, dropoff_address, service_type),
          delivery:delivery_id(id, pickup_address, dropoff_address, service_type)
        `, { count: 'exact' })
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      // Filtrar por periodo
      if (period === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data: earnings, error, count } = await query;

      if (error) throw error;

      return {
        earnings,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error obteniendo ganancias:', error);
      throw error;
    }
  },

  /**
   * Obtener tiempo conectado del conductor en un periodo
   */
  async getConnectedTime(driverId, period = 'today') {
    try {
      let dateFrom = new Date();

      if (period === 'today') {
        dateFrom.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        dateFrom.setDate(dateFrom.getDate() - 7);
      } else if (period === 'month') {
        dateFrom.setMonth(dateFrom.getMonth() - 1);
      }

      // Buscar sesiones de conexión del conductor
      const { data: sessions, error } = await supabaseAdmin
        .from('driver_sessions')
        .select('started_at, ended_at')
        .eq('driver_id', driverId)
        .gte('started_at', dateFrom.toISOString());

      if (error) {
        // Si la tabla no existe, devolver 0
        if (error.code === '42P01') return 0;
        throw error;
      }

      if (!sessions || sessions.length === 0) return 0;

      // Calcular minutos totales conectado
      let totalMinutes = 0;
      const now = new Date();

      for (const session of sessions) {
        const start = new Date(session.started_at);
        const end = session.ended_at ? new Date(session.ended_at) : now;
        const minutes = (end - start) / (1000 * 60);
        totalMinutes += minutes;
      }

      return Math.round(totalMinutes);
    } catch (error) {
      console.error('Error obteniendo tiempo conectado:', error);
      return 0;
    }
  },

  /**
   * Obtener puntos del conductor
   */
  async getDriverPoints(driverId) {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('points')
        .eq('id', driverId)
        .single();

      if (error) return 0;
      return profile?.points || 0;
    } catch (error) {
      console.error('Error obteniendo puntos del conductor:', error);
      return 0;
    }
  },

  /**
   * Obtener resumen de ganancias por periodo
   */
  async getEarningsSummary(driverId, period = 'today') {
    try {
      let dateFrom = new Date();

      if (period === 'today') {
        dateFrom.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        dateFrom.setDate(dateFrom.getDate() - 7);
      } else if (period === 'month') {
        dateFrom.setMonth(dateFrom.getMonth() - 1);
      }

      const { data: earnings, error } = await supabaseAdmin
        .from('driver_earnings')
        .select('net_amount, tip_amount, gross_amount, platform_fee')
        .eq('driver_id', driverId)
        .gte('created_at', dateFrom.toISOString());

      if (error) throw error;

      const summary = earnings.reduce((acc, e) => ({
        totalGross: acc.totalGross + parseFloat(e.gross_amount),
        totalNet: acc.totalNet + parseFloat(e.net_amount),
        totalTips: acc.totalTips + parseFloat(e.tip_amount || 0),
        totalFees: acc.totalFees + parseFloat(e.platform_fee),
        tripCount: acc.tripCount + 1,
      }), {
        totalGross: 0,
        totalNet: 0,
        totalTips: 0,
        totalFees: 0,
        tripCount: 0,
      });

      return {
        period,
        ...summary,
      };
    } catch (error) {
      console.error('Error obteniendo resumen de ganancias:', error);
      throw error;
    }
  },

  /**
   * Solicitar retiro de ganancias
   */
  async requestWithdrawal(driverId, amount, bankAccountId) {
    try {
      const wallet = await this.getWallet(driverId);
      const availableBalance = parseFloat(wallet.available_balance);
      const withdrawAmount = parseFloat(amount);

      if (!wallet.is_active) {
        throw new Error('Wallet desactivado');
      }

      if (wallet.is_blocked) {
        throw new Error('Wallet bloqueado: ' + wallet.blocked_reason);
      }

      if (withdrawAmount < 1000) {
        throw new Error('Monto minimo de retiro: $1,000');
      }

      if (availableBalance < withdrawAmount) {
        throw new Error('Saldo disponible insuficiente');
      }

      // Verificar cuenta bancaria
      const { data: bankAccount, error: bankError } = await supabaseAdmin
        .from('bank_accounts')
        .select('*')
        .eq('id', bankAccountId)
        .eq('user_id', driverId)
        .single();

      if (bankError || !bankAccount) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      // Verificar limite de retiros diarios
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayWithdrawals } = await supabaseAdmin
        .from('driver_withdrawals')
        .select('id')
        .eq('driver_id', driverId)
        .gte('created_at', today.toISOString())
        .neq('status', 'cancelled');

      if (todayWithdrawals && todayWithdrawals.length >= 1) {
        throw new Error('Ya realizaste un retiro hoy. Maximo 1 retiro por dia.');
      }

      // Calcular comision (primeros 4 retiros del mes gratis)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthWithdrawals } = await supabaseAdmin
        .from('driver_withdrawals')
        .select('id')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('created_at', monthStart.toISOString());

      const fee = (monthWithdrawals?.length || 0) >= 4 ? 50 : 0;
      const netAmount = withdrawAmount - fee;

      // Actualizar saldo
      const newAvailable = availableBalance - withdrawAmount;

      await supabaseAdmin
        .from('driver_wallets')
        .update({
          available_balance: newAvailable,
        })
        .eq('id', wallet.id);

      // Crear solicitud de retiro
      const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
        .from('driver_withdrawals')
        .insert({
          driver_id: driverId,
          wallet_id: wallet.id,
          bank_account_id: bankAccountId,
          amount: withdrawAmount,
          fee,
          net_amount: netAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

      return {
        success: true,
        withdrawalId: withdrawal.id,
        amount: withdrawAmount,
        fee,
        netAmount,
        estimatedTime: '24-48 horas habiles',
        bankAccount: {
          bank: bankAccount.bank_name,
          alias: bankAccount.alias,
          lastDigits: bankAccount.cbu?.slice(-4),
        },
      };
    } catch (error) {
      console.error('Error solicitando retiro:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de retiros
   */
  async getWithdrawals(driverId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('driver_withdrawals')
        .select(`
          *,
          bank_account:bank_account_id(bank_name, alias, cbu)
        `, { count: 'exact' })
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: withdrawals, error, count } = await query;

      if (error) throw error;

      return {
        withdrawals,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error obteniendo retiros:', error);
      throw error;
    }
  },
};

export default driverWalletService;
