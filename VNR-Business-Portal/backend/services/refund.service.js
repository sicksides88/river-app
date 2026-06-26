import { supabaseAdmin } from '../config/supabase.js';
import mercadoPagoService from './mercadopago.service.js';
import walletService from './wallet.service.js';

/**
 * Servicio de Reembolsos
 * Gestiona solicitudes de reembolso, aprobación y procesamiento
 */
export const refundService = {
  // Tiempo máximo para solicitar reembolso (días)
  MAX_DAYS_TO_REQUEST: 7,

  // Monto mínimo para reembolso bancario
  MIN_AMOUNT_BANK_REFUND: 100,

  /**
   * Obtener política de reembolso por motivo
   * @param {string} reason - Motivo del reembolso
   */
  async getRefundPolicy(reason) {
    try {
      const { data: policy, error } = await supabaseAdmin
        .from('refund_policies')
        .select('*')
        .eq('reason', reason)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return policy || {
        reason,
        refund_percentage: 0,
        is_auto_approved: false,
        max_days_to_request: this.MAX_DAYS_TO_REQUEST,
      };
    } catch (error) {
      console.error('Error obteniendo política:', error);
      throw error;
    }
  },

  /**
   * Calcular monto de reembolso según política
   * @param {number} originalAmount - Monto original del pago
   * @param {string} reason - Motivo del reembolso
   */
  async calculateRefundAmount(originalAmount, reason) {
    try {
      const policy = await this.getRefundPolicy(reason);

      const refundAmount = this.round(originalAmount * (policy.refund_percentage / 100));

      return {
        originalAmount,
        refundAmount,
        refundPercentage: policy.refund_percentage,
        isAutoApproved: policy.is_auto_approved,
        policy,
      };
    } catch (error) {
      console.error('Error calculando reembolso:', error);
      throw error;
    }
  },

  /**
   * Solicitar un reembolso
   * @param {Object} data - Datos de la solicitud
   */
  async requestRefund(data) {
    try {
      const {
        userId,
        paymentId,
        rideId,
        deliveryId,
        reason,
        reasonDetails,
        requestedBy = 'user',
      } = data;

      // Verificar que el pago existe y pertenece al usuario
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Pago no encontrado');
      }

      // Verificar que el pago está completado
      if (payment.status !== 'approved' && payment.status !== 'completed') {
        throw new Error('Solo se pueden reembolsar pagos completados');
      }

      // Verificar que no hay un reembolso pendiente para este pago
      const { data: existingRefund } = await supabaseAdmin
        .from('refunds')
        .select('id, status')
        .eq('payment_id', paymentId)
        .in('status', ['pending', 'approved', 'processing'])
        .single();

      if (existingRefund) {
        throw new Error('Ya existe una solicitud de reembolso pendiente para este pago');
      }

      // Verificar tiempo máximo para solicitar
      const policy = await this.getRefundPolicy(reason);
      const maxDays = policy.max_days_to_request || this.MAX_DAYS_TO_REQUEST;
      const paymentDate = new Date(payment.created_at);
      const daysSincePayment = Math.floor((Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSincePayment > maxDays) {
        throw new Error(`El tiempo máximo para solicitar reembolso es de ${maxDays} días`);
      }

      // Calcular monto de reembolso
      const calculation = await this.calculateRefundAmount(payment.amount, reason);

      if (calculation.refundAmount <= 0) {
        throw new Error('El monto de reembolso es 0 según la política de la plataforma');
      }

      // Determinar método de reembolso
      let refundMethod = 'wallet'; // Por defecto a wallet
      if (payment.mp_payment_id && calculation.refundAmount >= this.MIN_AMOUNT_BANK_REFUND) {
        refundMethod = 'original_payment'; // A MercadoPago si hay pago y monto suficiente
      }

      // Crear solicitud de reembolso
      const refundData = {
        payment_id: paymentId,
        ride_id: rideId,
        delivery_id: deliveryId,
        user_id: userId,
        requested_by: requestedBy,
        reason,
        reason_details: reasonDetails,
        original_amount: payment.amount,
        refund_amount: calculation.refundAmount,
        refund_percentage: calculation.refundPercentage,
        refund_type: calculation.refundPercentage === 100 ? 'full' : 'partial',
        refund_method: refundMethod,
        status: calculation.isAutoApproved ? 'approved' : 'pending',
      };

      const { data: refund, error: refundError } = await supabaseAdmin
        .from('refunds')
        .insert(refundData)
        .select()
        .single();

      if (refundError) throw refundError;

      // Si es auto-aprobado, procesar inmediatamente
      if (calculation.isAutoApproved) {
        await this.processRefund(refund.id);
      }

      return {
        success: true,
        refund,
        isAutoApproved: calculation.isAutoApproved,
        message: calculation.isAutoApproved
          ? 'Reembolso aprobado y en proceso'
          : 'Solicitud de reembolso enviada, pendiente de revisión',
      };
    } catch (error) {
      console.error('Error solicitando reembolso:', error);
      throw error;
    }
  },

  /**
   * Aprobar un reembolso (Admin)
   * @param {string} refundId - ID del reembolso
   * @param {string} adminId - ID del admin que aprueba
   */
  async approveRefund(refundId, adminId) {
    try {
      const { data: refund, error } = await supabaseAdmin
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .single();

      if (error || !refund) {
        throw new Error('Reembolso no encontrado');
      }

      if (refund.status !== 'pending') {
        throw new Error('Solo se pueden aprobar reembolsos pendientes');
      }

      // Actualizar estado a aprobado
      const { error: updateError } = await supabaseAdmin
        .from('refunds')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', refundId);

      if (updateError) throw updateError;

      // Procesar el reembolso
      await this.processRefund(refundId);

      return {
        success: true,
        message: 'Reembolso aprobado y en proceso',
      };
    } catch (error) {
      console.error('Error aprobando reembolso:', error);
      throw error;
    }
  },

  /**
   * Rechazar un reembolso (Admin)
   * @param {string} refundId - ID del reembolso
   * @param {string} adminId - ID del admin
   * @param {string} rejectionReason - Motivo del rechazo
   */
  async rejectRefund(refundId, adminId, rejectionReason) {
    try {
      const { data: refund, error } = await supabaseAdmin
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .single();

      if (error || !refund) {
        throw new Error('Reembolso no encontrado');
      }

      if (refund.status !== 'pending') {
        throw new Error('Solo se pueden rechazar reembolsos pendientes');
      }

      const { error: updateError } = await supabaseAdmin
        .from('refunds')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', refundId);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Reembolso rechazado',
      };
    } catch (error) {
      console.error('Error rechazando reembolso:', error);
      throw error;
    }
  },

  /**
   * Procesar un reembolso aprobado
   * @param {string} refundId - ID del reembolso
   */
  async processRefund(refundId) {
    try {
      const { data: refund, error } = await supabaseAdmin
        .from('refunds')
        .select('*, payments:payment_id(*)')
        .eq('id', refundId)
        .single();

      if (error || !refund) {
        throw new Error('Reembolso no encontrado');
      }

      if (!['approved', 'pending'].includes(refund.status)) {
        throw new Error('El reembolso no está en estado válido para procesar');
      }

      // Actualizar estado a procesando
      await supabaseAdmin
        .from('refunds')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString(),
        })
        .eq('id', refundId);

      let result;

      // Procesar según el método de reembolso
      if (refund.refund_method === 'original_payment' && refund.payments?.mp_payment_id) {
        result = await this.refundToMercadoPago(refund);
      } else {
        result = await this.refundToWallet(refund);
      }

      // Actualizar estado final
      await supabaseAdmin
        .from('refunds')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: result.success ? new Date().toISOString() : null,
          mp_refund_id: result.mpRefundId || null,
          mp_refund_status: result.mpStatus || null,
          wallet_transaction_id: result.walletTransactionId || null,
          metadata: {
            ...refund.metadata,
            processing_result: result,
          },
        })
        .eq('id', refundId);

      return result;
    } catch (error) {
      console.error('Error procesando reembolso:', error);

      // Marcar como fallido
      await supabaseAdmin
        .from('refunds')
        .update({
          status: 'failed',
          metadata: {
            error: error.message,
          },
        })
        .eq('id', refundId);

      throw error;
    }
  },

  /**
   * Reembolsar a MercadoPago (pago original)
   * @param {Object} refund - Objeto de reembolso
   */
  async refundToMercadoPago(refund) {
    try {
      const mpPaymentId = refund.payments?.mp_payment_id;

      if (!mpPaymentId) {
        throw new Error('No hay pago de MercadoPago asociado');
      }

      // Crear reembolso en MercadoPago
      const mpRefund = await mercadoPagoService.createRefund(
        mpPaymentId,
        refund.refund_type === 'partial' ? refund.refund_amount : null
      );

      return {
        success: true,
        method: 'mercadopago',
        mpRefundId: mpRefund.refundId,
        mpStatus: mpRefund.status,
        amount: refund.refund_amount,
      };
    } catch (error) {
      console.error('Error reembolsando a MercadoPago:', error);

      // Fallback a wallet si falla MP
      console.log('Intentando reembolso a wallet como fallback...');
      return await this.refundToWallet(refund);
    }
  },

  /**
   * Reembolsar a wallet del usuario
   * @param {Object} refund - Objeto de reembolso
   */
  async refundToWallet(refund) {
    try {
      // Crear transacción de reembolso en wallet
      const transaction = await walletService.addTransaction(refund.user_id, {
        type: 'refund',
        amount: refund.refund_amount,
        description: `Reembolso - ${this.getReasonLabel(refund.reason)}`,
        referenceType: refund.ride_id ? 'ride' : refund.delivery_id ? 'delivery' : 'refund',
        referenceId: refund.ride_id || refund.delivery_id || refund.id,
        paymentId: refund.payment_id,
      });

      return {
        success: true,
        method: 'wallet',
        walletTransactionId: transaction.id,
        amount: refund.refund_amount,
      };
    } catch (error) {
      console.error('Error reembolsando a wallet:', error);
      throw error;
    }
  },

  /**
   * Obtener reembolso por ID
   * @param {string} refundId - ID del reembolso
   */
  async getRefundById(refundId) {
    try {
      const { data: refund, error } = await supabaseAdmin
        .from('refunds')
        .select(`
          *,
          user:user_id (id, first_name, last_name, email),
          reviewer:reviewed_by (id, first_name, last_name),
          ride:ride_id (id, pickup_address, dropoff_address),
          delivery:delivery_id (id, pickup_address, dropoff_address)
        `)
        .eq('id', refundId)
        .single();

      if (error) throw error;

      return refund;
    } catch (error) {
      console.error('Error obteniendo reembolso:', error);
      throw error;
    }
  },

  /**
   * Obtener reembolsos de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado
   */
  async getUserRefunds(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('refunds')
        .select(`
          *,
          ride:ride_id (id, pickup_address, dropoff_address),
          delivery:delivery_id (id, pickup_address, dropoff_address)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: refunds, error, count } = await query;

      if (error) throw error;

      return {
        refunds,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error obteniendo reembolsos del usuario:', error);
      throw error;
    }
  },

  /**
   * Obtener reembolsos pendientes (Admin)
   * @param {Object} options - Opciones de filtrado
   */
  async getPendingRefunds(options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const { data: refunds, error, count } = await supabaseAdmin
        .from('refunds')
        .select(`
          *,
          user:user_id (id, first_name, last_name, email),
          ride:ride_id (id, pickup_address, dropoff_address),
          delivery:delivery_id (id, pickup_address, dropoff_address)
        `, { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        refunds,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error obteniendo reembolsos pendientes:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de reembolsos (Admin)
   * @param {Object} options - Opciones de filtrado
   */
  async getRefundStats(options = {}) {
    try {
      const { dateFrom, dateTo } = options;

      let query = supabaseAdmin
        .from('refunds')
        .select('status, refund_amount, reason');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: refunds, error } = await query;

      if (error) throw error;

      // Calcular estadísticas
      const stats = {
        total: refunds.length,
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
        failed: 0,
        totalAmountRefunded: 0,
        totalAmountPending: 0,
        byReason: {},
      };

      refunds.forEach((r) => {
        stats[r.status] = (stats[r.status] || 0) + 1;

        if (r.status === 'completed') {
          stats.totalAmountRefunded += parseFloat(r.refund_amount);
        } else if (['pending', 'approved', 'processing'].includes(r.status)) {
          stats.totalAmountPending += parseFloat(r.refund_amount);
        }

        stats.byReason[r.reason] = (stats.byReason[r.reason] || 0) + 1;
      });

      stats.approvalRate = stats.total > 0
        ? this.round(((stats.completed + stats.approved) / stats.total) * 100)
        : 0;

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las políticas de reembolso
   */
  async getAllPolicies() {
    try {
      const { data: policies, error } = await supabaseAdmin
        .from('refund_policies')
        .select('*')
        .eq('is_active', true)
        .order('refund_percentage', { ascending: false });

      if (error) throw error;

      return policies;
    } catch (error) {
      console.error('Error obteniendo políticas:', error);
      throw error;
    }
  },

  /**
   * Cancelar solicitud de reembolso (usuario)
   * @param {string} refundId - ID del reembolso
   * @param {string} userId - ID del usuario
   */
  async cancelRefund(refundId, userId) {
    try {
      const { data: refund, error } = await supabaseAdmin
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .eq('user_id', userId)
        .single();

      if (error || !refund) {
        throw new Error('Reembolso no encontrado');
      }

      if (refund.status !== 'pending') {
        throw new Error('Solo se pueden cancelar reembolsos pendientes');
      }

      const { error: updateError } = await supabaseAdmin
        .from('refunds')
        .update({ status: 'cancelled' })
        .eq('id', refundId);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Solicitud de reembolso cancelada',
      };
    } catch (error) {
      console.error('Error cancelando reembolso:', error);
      throw error;
    }
  },

  /**
   * Obtener etiqueta legible del motivo
   * @param {string} reason - Código del motivo
   */
  getReasonLabel(reason) {
    const labels = {
      cancelled_before_assignment: 'Cancelación antes de asignar conductor',
      cancelled_after_assignment: 'Cancelación después de asignar conductor',
      cancelled_driver_enroute: 'Cancelación con conductor en camino',
      driver_no_show: 'El conductor no llegó',
      user_no_show: 'No show del usuario',
      service_not_completed: 'Servicio no completado',
      poor_service: 'Servicio de mala calidad',
      overcharge: 'Cobro excesivo',
      duplicate_charge: 'Cobro duplicado',
      technical_error: 'Error técnico',
      other: 'Otro motivo',
    };
    return labels[reason] || reason;
  },

  /**
   * Redondear a 2 decimales
   */
  round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  },
};

export default refundService;
