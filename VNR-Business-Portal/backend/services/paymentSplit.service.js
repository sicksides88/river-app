import { supabaseAdmin } from '../config/supabase.js';
import driverWalletService from './driverWallet.service.js';

/**
 * Servicio de División de Pagos
 * Gestiona la división de pagos entre plataforma y conductor
 */
export const paymentSplitService = {
  // Configuración por defecto si no hay en BD
  DEFAULT_COMMISSION: {
    platform_percentage: 20.00,
    driver_percentage: 80.00,
    min_platform_fee: 50.00,
  },

  /**
   * Obtener configuración de comisión para un tipo de servicio
   * @param {string} serviceType - Tipo de servicio (vuelta-segura, chofer, envio, flete)
   */
  async getCommissionRate(serviceType) {
    try {
      const { data: commission, error } = await supabaseAdmin
        .from('commission_settings')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .lte('effective_from', new Date().toISOString())
        .or('effective_until.is.null,effective_until.gt.' + new Date().toISOString())
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo comisión:', error);
      }

      if (!commission) {
        // Retornar configuración por defecto
        return {
          ...this.DEFAULT_COMMISSION,
          service_type: serviceType,
          id: null,
        };
      }

      return commission;
    } catch (error) {
      console.error('Error obteniendo tasa de comisión:', error);
      return {
        ...this.DEFAULT_COMMISSION,
        service_type: serviceType,
        id: null,
      };
    }
  },

  /**
   * Calcular división de pago
   * @param {number} amount - Monto total del servicio
   * @param {string} serviceType - Tipo de servicio
   */
  async calculateSplit(amount, serviceType) {
    try {
      const commission = await this.getCommissionRate(serviceType);

      // Calcular comisión plataforma
      let platformAmount = this.round(amount * (commission.platform_percentage / 100));

      // Aplicar mínimo solo si el monto total lo permite
      if (commission.min_platform_fee && platformAmount < commission.min_platform_fee && commission.min_platform_fee <= amount) {
        platformAmount = commission.min_platform_fee;
      }

      // Aplicar máximo si corresponde
      if (commission.max_platform_fee && platformAmount > commission.max_platform_fee) {
        platformAmount = commission.max_platform_fee;
      }

      // Asegurar que no sea mayor al monto total
      if (platformAmount > amount) {
        platformAmount = amount;
      }

      // Calcular ganancia conductor
      const driverAmount = this.round(amount - platformAmount);

      return {
        totalAmount: amount,
        platformAmount,
        platformPercentage: commission.platform_percentage,
        driverAmount,
        driverPercentage: commission.driver_percentage,
        commissionId: commission.id,
        serviceType,
      };
    } catch (error) {
      console.error('Error calculando división:', error);
      throw error;
    }
  },

  /**
   * Registrar división de pago y crear ganancia para conductor
   * @param {Object} data - Datos de la división
   */
  async recordSplit(data) {
    try {
      const {
        paymentId,
        rideId,
        deliveryId,
        driverId,
        userId,
        serviceType,
        totalAmount,
        tipAmount = 0,
      } = data;

      // Calcular división
      const split = await this.calculateSplit(totalAmount, serviceType);

      // Total para el conductor (ganancia + propina)
      const driverTotal = this.round(split.driverAmount + tipAmount);

      // Registrar en payment_splits
      const { data: splitRecord, error: splitError } = await supabaseAdmin
        .from('payment_splits')
        .insert({
          payment_id: paymentId,
          ride_id: rideId,
          delivery_id: deliveryId,
          driver_id: driverId,
          user_id: userId,
          commission_setting_id: split.commissionId,
          service_type: serviceType,
          total_amount: totalAmount,
          platform_amount: split.platformAmount,
          platform_percentage: split.platformPercentage,
          driver_amount: split.driverAmount,
          driver_percentage: split.driverPercentage,
          tip_amount: tipAmount,
          tip_percentage: tipAmount > 0 ? this.round((tipAmount / totalAmount) * 100) : null,
          driver_total: driverTotal,
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (splitError) throw splitError;

      // Registrar ganancia en wallet del conductor
      if (driverId) {
        await driverWalletService.addEarning(driverId, {
          rideId,
          deliveryId,
          grossAmount: totalAmount,
          platformFee: split.platformAmount,
          netAmount: split.driverAmount,
          tipAmount,
        });
      }

      return {
        success: true,
        split: splitRecord,
        breakdown: {
          total: totalAmount,
          platform: split.platformAmount,
          driver: split.driverAmount,
          tip: tipAmount,
          driverTotal,
        },
      };
    } catch (error) {
      console.error('Error registrando división:', error);
      throw error;
    }
  },

  /**
   * Registrar división de pago con datos de MercadoPago (Split Payment)
   * Usado cuando el pago va directamente a la cuenta MP del conductor
   * @param {Object} data - Datos de la división con info de MP
   */
  async recordSplitWithMP(data) {
    try {
      const {
        paymentId,
        rideId,
        deliveryId,
        driverId,
        userId,
        serviceType,
        totalAmount,
        tipAmount = 0,
        // Campos específicos de MP Split
        mpPaymentId,
        mpApplicationFee,
        mpCollectorId,
      } = data;

      // Idempotencia: verificar si ya existe un split para este payment
      const { data: existingSplit } = await supabaseAdmin
        .from('payment_splits')
        .select('id')
        .eq('payment_id', paymentId)
        .single();

      if (existingSplit) {
        console.log(`[Split] Ya existe split para payment ${paymentId}, omitiendo duplicado`);
        return { success: true, split: existingSplit, duplicate: true };
      }

      // Calcular división
      const split = await this.calculateSplit(totalAmount, serviceType);

      // Total para el conductor (ganancia + propina)
      const driverTotal = this.round(split.driverAmount + tipAmount);

      // Registrar en payment_splits con campos MP
      const { data: splitRecord, error: splitError } = await supabaseAdmin
        .from('payment_splits')
        .insert({
          payment_id: paymentId,
          ride_id: rideId,
          delivery_id: deliveryId,
          driver_id: driverId,
          user_id: userId,
          commission_setting_id: split.commissionId,
          service_type: serviceType,
          total_amount: totalAmount,
          platform_amount: split.platformAmount,
          platform_percentage: split.platformPercentage,
          driver_amount: split.driverAmount,
          driver_percentage: split.driverPercentage,
          tip_amount: tipAmount,
          tip_percentage: tipAmount > 0 ? this.round((tipAmount / totalAmount) * 100) : null,
          driver_total: driverTotal,
          status: 'processed',
          processed_at: new Date().toISOString(),
          // Campos específicos de MercadoPago Split Payment
          payment_type: 'split',
          mp_payment_id: mpPaymentId,
          mp_application_fee: mpApplicationFee,
          mp_collector_id: mpCollectorId,
        })
        .select()
        .single();

      if (splitError) throw splitError;

      // NOTA: No registramos en driver_earnings porque el pago ya fue
      // directamente a la cuenta MP del conductor

      return {
        success: true,
        split: splitRecord,
        breakdown: {
          total: totalAmount,
          platform: split.platformAmount,
          driver: split.driverAmount,
          tip: tipAmount,
          driverTotal,
          paymentType: 'split',
          mpPaymentId,
        },
      };
    } catch (error) {
      console.error('Error registrando división con MP:', error);
      throw error;
    }
  },

  /**
   * Agregar propina a un viaje/envío existente
   * @param {Object} data - Datos de la propina
   */
  async addTip(data) {
    try {
      const {
        rideId,
        deliveryId,
        userId,
        driverId,
        amount,
        percentage,
        paymentMethod = 'wallet',
        message,
      } = data;

      // Verificar que el viaje/envío exista
      let serviceRecord;
      if (rideId) {
        const { data: ride } = await supabaseAdmin
          .from('rides')
          .select('id, driver_id, status')
          .eq('id', rideId)
          .single();
        serviceRecord = ride;
      } else if (deliveryId) {
        const { data: delivery } = await supabaseAdmin
          .from('deliveries')
          .select('id, driver_id, status')
          .eq('id', deliveryId)
          .single();
        serviceRecord = delivery;
      }

      if (!serviceRecord) {
        throw new Error('Viaje o envío no encontrado');
      }

      // Obtener payment_split si existe
      const { data: existingSplit } = await supabaseAdmin
        .from('payment_splits')
        .select('id')
        .or(`ride_id.eq.${rideId},delivery_id.eq.${deliveryId}`)
        .single();

      // Crear registro de propina
      const { data: tip, error: tipError } = await supabaseAdmin
        .from('tips')
        .insert({
          ride_id: rideId,
          delivery_id: deliveryId,
          user_id: userId,
          driver_id: driverId || serviceRecord.driver_id,
          payment_split_id: existingSplit?.id,
          amount,
          percentage,
          payment_method: paymentMethod,
          message,
          status: 'pending',
        })
        .select()
        .single();

      if (tipError) throw tipError;

      // Si hay payment_split, actualizar el tip_amount
      if (existingSplit) {
        await supabaseAdmin
          .from('payment_splits')
          .update({
            tip_amount: supabaseAdmin.raw(`tip_amount + ${amount}`),
            driver_total: supabaseAdmin.raw(`driver_total + ${amount}`),
          })
          .eq('id', existingSplit.id);
      }

      // Agregar propina al wallet del conductor
      const targetDriverId = driverId || serviceRecord.driver_id;
      if (targetDriverId) {
        await driverWalletService.addEarning(targetDriverId, {
          rideId,
          deliveryId,
          grossAmount: amount,
          platformFee: 0, // Sin comisión sobre propinas
          netAmount: amount,
          tipAmount: amount,
        });

        // Marcar propina como completada
        await supabaseAdmin
          .from('tips')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', tip.id);
      }

      return {
        success: true,
        tip,
        message: 'Propina enviada correctamente',
      };
    } catch (error) {
      console.error('Error agregando propina:', error);
      throw error;
    }
  },

  /**
   * Obtener división de un pago específico
   * @param {string} paymentId - ID del pago
   */
  async getSplitByPayment(paymentId) {
    try {
      const { data: split, error } = await supabaseAdmin
        .from('payment_splits')
        .select(`
          *,
          driver:driver_id (id, first_name, last_name),
          commission:commission_setting_id (service_type, platform_percentage, driver_percentage)
        `)
        .eq('payment_id', paymentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return split;
    } catch (error) {
      console.error('Error obteniendo división:', error);
      throw error;
    }
  },

  /**
   * Obtener divisiones de un conductor
   * @param {string} driverId - ID del conductor
   * @param {Object} options - Opciones de filtrado
   */
  async getDriverSplits(driverId, options = {}) {
    try {
      const { page = 1, limit = 20, dateFrom, dateTo, serviceType } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('payment_splits')
        .select('*', { count: 'exact' })
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }
      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: splits, error, count } = await query;

      if (error) throw error;

      return {
        splits,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error obteniendo divisiones del conductor:', error);
      throw error;
    }
  },

  /**
   * Obtener resumen de ganancias de la plataforma
   * @param {Object} options - Opciones de filtrado
   */
  async getPlatformEarningsSummary(options = {}) {
    try {
      const { dateFrom, dateTo, serviceType } = options;

      let query = supabaseAdmin
        .from('payment_splits')
        .select('service_type, total_amount, platform_amount, driver_amount, tip_amount')
        .in('status', ['processed', 'paid']);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }
      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data: splits, error } = await query;

      if (error) throw error;

      // Agregar por tipo de servicio
      const summary = {};
      let totals = {
        totalAmount: 0,
        platformAmount: 0,
        driverAmount: 0,
        tipAmount: 0,
        count: 0,
      };

      splits.forEach((split) => {
        if (!summary[split.service_type]) {
          summary[split.service_type] = {
            totalAmount: 0,
            platformAmount: 0,
            driverAmount: 0,
            tipAmount: 0,
            count: 0,
          };
        }

        const s = summary[split.service_type];
        s.totalAmount += parseFloat(split.total_amount);
        s.platformAmount += parseFloat(split.platform_amount);
        s.driverAmount += parseFloat(split.driver_amount);
        s.tipAmount += parseFloat(split.tip_amount || 0);
        s.count++;

        totals.totalAmount += parseFloat(split.total_amount);
        totals.platformAmount += parseFloat(split.platform_amount);
        totals.driverAmount += parseFloat(split.driver_amount);
        totals.tipAmount += parseFloat(split.tip_amount || 0);
        totals.count++;
      });

      return {
        byService: summary,
        totals,
      };
    } catch (error) {
      console.error('Error obteniendo resumen de plataforma:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las configuraciones de comisión
   */
  async getAllCommissionSettings() {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('commission_settings')
        .select('*')
        .eq('is_active', true)
        .order('service_type');

      if (error) throw error;

      return settings;
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      throw error;
    }
  },

  /**
   * Actualizar configuración de comisión (Admin)
   * @param {string} serviceType - Tipo de servicio
   * @param {Object} data - Nuevos datos
   */
  async updateCommissionSetting(serviceType, data) {
    try {
      const { platformPercentage, driverPercentage, minPlatformFee, maxPlatformFee } = data;

      // Validar que sumen 100
      if (platformPercentage + driverPercentage !== 100) {
        throw new Error('Los porcentajes deben sumar 100%');
      }

      // Desactivar configuración anterior
      await supabaseAdmin
        .from('commission_settings')
        .update({
          is_active: false,
          effective_until: new Date().toISOString(),
        })
        .eq('service_type', serviceType)
        .eq('is_active', true);

      // Crear nueva configuración
      const { data: newSetting, error } = await supabaseAdmin
        .from('commission_settings')
        .insert({
          service_type: serviceType,
          platform_percentage: platformPercentage,
          driver_percentage: driverPercentage,
          min_platform_fee: minPlatformFee || 0,
          max_platform_fee: maxPlatformFee,
          is_active: true,
          effective_from: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        setting: newSetting,
      };
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      throw error;
    }
  },

  /**
   * Obtener propinas de un conductor
   * @param {string} driverId - ID del conductor
   * @param {Object} options - Opciones
   */
  async getDriverTips(driverId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const { data: tips, error, count } = await supabaseAdmin
        .from('tips')
        .select(`
          *,
          user:user_id (id, first_name, last_name)
        `, { count: 'exact' })
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Calcular total
      const { data: totalData } = await supabaseAdmin
        .from('tips')
        .select('amount')
        .eq('driver_id', driverId)
        .eq('status', 'completed');

      const totalTips = totalData?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      return {
        tips,
        total: count,
        page,
        pages: Math.ceil(count / limit),
        totalAmount: totalTips,
      };
    } catch (error) {
      console.error('Error obteniendo propinas:', error);
      throw error;
    }
  },

  /**
   * Redondear a 2 decimales
   */
  round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  },
};

export default paymentSplitService;
