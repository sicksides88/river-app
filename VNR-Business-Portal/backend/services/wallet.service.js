import { supabaseAdmin } from '../config/supabase.js';
import mercadoPagoService from './mercadopago.service.js';

/**
 * Servicio de Wallet para usuarios
 */
export const walletService = {
  /**
   * Obtener wallet del usuario (o crear si no existe)
   */
  async getWallet(userId) {
    try {
      // Buscar wallet existente
      let { data: wallet, error } = await supabaseAdmin
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Si no existe, crear uno nuevo
      if (error && error.code === 'PGRST116') {
        wallet = await this.createWallet(userId);
      } else if (error) {
        throw error;
      }

      return wallet;
    } catch (error) {
      console.error('Error obteniendo wallet:', error);
      throw error;
    }
  },

  /**
   * Crear wallet para un usuario
   */
  async createWallet(userId) {
    try {
      const { data: wallet, error } = await supabaseAdmin
        .from('user_wallets')
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'ARS',
        })
        .select()
        .single();

      if (error) throw error;
      return wallet;
    } catch (error) {
      console.error('Error creando wallet:', error);
      throw error;
    }
  },

  /**
   * Obtener saldo del usuario
   */
  async getBalance(userId) {
    try {
      const wallet = await this.getWallet(userId);
      return {
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
        isActive: wallet.is_active,
      };
    } catch (error) {
      console.error('Error obteniendo saldo:', error);
      throw error;
    }
  },

  /**
   * Iniciar recarga de saldo (crea preferencia de MercadoPago)
   */
  async initiateDeposit(userId, amount) {
    try {
      const wallet = await this.getWallet(userId);

      if (!wallet.is_active) {
        throw new Error('Wallet desactivado');
      }

      if (wallet.is_blocked) {
        throw new Error('Wallet bloqueado: ' + wallet.blocked_reason);
      }

      // Validar monto
      if (amount < 100) {
        throw new Error('Monto minimo de recarga: $100');
      }
      if (amount > 50000) {
        throw new Error('Monto maximo de recarga: $50,000');
      }

      // Crear registro de pago pendiente
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId,
          amount,
          status: 'pending',
          payment_method: 'mercadopago',
          description: `Recarga de saldo VNR - $${amount}`,
          metadata: {
            type: 'wallet_deposit',
            wallet_id: wallet.id,
          },
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Crear preferencia en MercadoPago
      const preference = await mercadoPagoService.createPreference({
        userId,
        amount,
        title: 'Recarga de saldo VNR',
        description: `Recarga de $${amount} a tu wallet VNR`,
        externalReference: payment.id,
        metadata: {
          type: 'wallet_deposit',
          wallet_id: wallet.id,
        },
      });

      // Actualizar pago con ID de preferencia
      await supabaseAdmin
        .from('payments')
        .update({
          mp_preference_id: preference.preferenceId,
        })
        .eq('id', payment.id);

      return {
        paymentId: payment.id,
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
      };
    } catch (error) {
      console.error('Error iniciando deposito:', error);
      throw error;
    }
  },

  /**
   * Confirmar deposito (llamado desde webhook o callback)
   */
  async confirmDeposit(paymentId, mpPaymentId) {
    try {
      // Obtener pago
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      if (payment.status === 'approved') {
        return { success: true, message: 'Deposito ya procesado' };
      }

      // Obtener wallet
      const wallet = await this.getWallet(payment.user_id);
      const currentBalance = parseFloat(wallet.balance);
      const depositAmount = parseFloat(payment.amount);
      const newBalance = currentBalance + depositAmount;

      // Iniciar transaccion
      // Actualizar saldo del wallet
      const { error: walletError } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
        })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Registrar transaccion
      const { error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: payment.user_id,
          type: 'deposit',
          amount: depositAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          status: 'completed',
          reference_type: 'mercadopago',
          payment_id: payment.id,
          description: `Recarga de saldo - $${depositAmount}`,
        });

      if (txError) throw txError;

      // Actualizar estado del pago
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'approved',
          mp_payment_id: mpPaymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      return {
        success: true,
        newBalance,
        amount: depositAmount,
      };
    } catch (error) {
      console.error('Error confirmando deposito:', error);
      throw error;
    }
  },

  /**
   * Pagar con saldo del wallet
   */
  async pay(userId, amount, referenceType, referenceId, description) {
    try {
      const wallet = await this.getWallet(userId);
      const currentBalance = parseFloat(wallet.balance);
      const payAmount = parseFloat(amount);

      if (!wallet.is_active) {
        throw new Error('Wallet desactivado');
      }

      if (currentBalance < payAmount) {
        throw new Error('Saldo insuficiente');
      }

      const newBalance = currentBalance - payAmount;

      // Actualizar saldo
      const { error: walletError } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
        })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Registrar transaccion
      const { data: transaction, error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          type: 'payment',
          amount: -payAmount, // Negativo porque es un egreso
          balance_before: currentBalance,
          balance_after: newBalance,
          status: 'completed',
          reference_type: referenceType,
          reference_id: referenceId,
          description: description || 'Pago con saldo',
        })
        .select()
        .single();

      if (txError) throw txError;

      return {
        success: true,
        transactionId: transaction.id,
        newBalance,
        amount: payAmount,
      };
    } catch (error) {
      console.error('Error procesando pago con wallet:', error);
      throw error;
    }
  },

  /**
   * Reembolsar al wallet
   */
  async refund(userId, amount, referenceType, referenceId, description) {
    try {
      const wallet = await this.getWallet(userId);
      const currentBalance = parseFloat(wallet.balance);
      const refundAmount = parseFloat(amount);
      const newBalance = currentBalance + refundAmount;

      // Actualizar saldo
      const { error: walletError } = await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
        })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Registrar transaccion
      const { data: transaction, error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          type: 'refund',
          amount: refundAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          status: 'completed',
          reference_type: referenceType,
          reference_id: referenceId,
          description: description || 'Reembolso',
        })
        .select()
        .single();

      if (txError) throw txError;

      return {
        success: true,
        transactionId: transaction.id,
        newBalance,
        amount: refundAmount,
      };
    } catch (error) {
      console.error('Error procesando reembolso:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de transacciones
   */
  async getTransactions(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data: transactions, error, count } = await query;

      if (error) throw error;

      return {
        transactions,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      throw error;
    }
  },

  /**
   * Solicitar retiro de saldo
   */
  async requestWithdrawal(userId, amount, bankAccountId) {
    try {
      const wallet = await this.getWallet(userId);
      const currentBalance = parseFloat(wallet.balance);
      const withdrawAmount = parseFloat(amount);

      if (!wallet.is_active) {
        throw new Error('Wallet desactivado');
      }

      if (withdrawAmount < 500) {
        throw new Error('Monto minimo de retiro: $500');
      }

      if (currentBalance < withdrawAmount) {
        throw new Error('Saldo insuficiente');
      }

      // Verificar cuenta bancaria
      const { data: bankAccount, error: bankError } = await supabaseAdmin
        .from('bank_accounts')
        .select('*')
        .eq('id', bankAccountId)
        .eq('user_id', userId)
        .single();

      if (bankError || !bankAccount) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      const newBalance = currentBalance - withdrawAmount;

      // Actualizar saldo (reservar el monto)
      await supabaseAdmin
        .from('user_wallets')
        .update({
          balance: newBalance,
        })
        .eq('id', wallet.id);

      // Registrar transaccion
      const { data: transaction } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          type: 'withdrawal',
          amount: -withdrawAmount,
          balance_before: currentBalance,
          balance_after: newBalance,
          status: 'pending',
          reference_type: 'bank_transfer',
          description: `Retiro a ${bankAccount.bank_name} - ${bankAccount.alias || bankAccount.cbu}`,
          metadata: {
            bank_account_id: bankAccountId,
          },
        })
        .select()
        .single();

      return {
        success: true,
        transactionId: transaction.id,
        amount: withdrawAmount,
        estimatedTime: '24-72 horas habiles',
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
};

export default walletService;
