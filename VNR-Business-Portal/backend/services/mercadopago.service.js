import { paymentClient, preferenceClient, mpConfig } from '../config/mercadopago.js';
import { supabaseAdmin } from '../config/supabase.js';
import mercadoPagoOAuthService from './mercadopagoOAuth.service.js';
import paymentSplitService from './paymentSplit.service.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Servicio de MercadoPago para procesamiento de pagos
 */
export const mercadoPagoService = {
  /**
   * Obtener email del payer para la preferencia
   * En sandbox se usa el email de test buyer para evitar conflictos
   */
  _getPayerEmail(userEmail) {
    if (!isProduction && process.env.MP_TEST_BUYER_EMAIL) {
      return process.env.MP_TEST_BUYER_EMAIL;
    }
    return userEmail || 'test_user_buyer@testuser.com';
  },

  /**
   * Crear una preferencia de pago (Checkout Pro)
   * Usado para recargas de wallet y pagos generales
   */
  async createPreference(data) {
    const {
      userId,
      amount,
      title,
      description,
      externalReference,
      metadata = {},
    } = data;

    try {
      // Obtener datos del usuario
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('email, nombre, apellido')
        .eq('id', userId)
        .single();

      const payerEmail = this._getPayerEmail(user?.email);

      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: externalReference,
              title: title || 'Pago VNR',
              description: description || 'Pago en plataforma VNR',
              quantity: 1,
              currency_id: 'ARS',
              unit_price: parseFloat(amount),
            },
          ],
          payer: {
            email: payerEmail,
            name: user?.nombre || 'Usuario',
            surname: user?.apellido || 'VNR',
          },
          back_urls: mpConfig.backUrls,
          auto_return: 'all',
          external_reference: externalReference,
          notification_url: mpConfig.notificationUrl,
          metadata: {
            user_id: userId,
            ...metadata,
          },
          statement_descriptor: 'VNR',
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        },
      });

      return {
        success: true,
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      };
    } catch (error) {
      console.error('Error creando preferencia MP:', error);
      throw error;
    }
  },

  /**
   * Crear una preferencia de pago con split (Checkout Pro directo a driver)
   * El pago va a la cuenta MP del driver, VNR cobra marketplace_fee
   */
  async createPreferenceWithSplit(data) {
    const {
      driverId,
      userId,
      amount,
      title,
      description,
      externalReference,
      serviceType,
      metadata = {},
    } = data;

    try {
      // 1. Obtener access_token del driver
      const tokenResult = await mercadoPagoOAuthService.getValidAccessToken(driverId);
      if (!tokenResult.success) {
        throw new Error(`No se pudo obtener token del driver: ${tokenResult.error}`);
      }

      // 2. Calcular split usando paymentSplitService
      const split = await paymentSplitService.calculateSplit(amount, serviceType);

      // 3. Obtener MP user ID del driver (collector)
      const mpUserId = await mercadoPagoOAuthService.getMPUserId(driverId);
      if (!mpUserId) {
        throw new Error('No se encontró MP User ID del driver');
      }

      // 4. Obtener datos del usuario pagador
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('email, nombre, apellido')
        .eq('id', userId)
        .single();

      const payerEmail = this._getPayerEmail(user?.email);

      // 5. Crear preferencia con token del driver + marketplace_fee
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenResult.accessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              id: externalReference,
              title: title || 'Pago VNR',
              description: description || 'Pago en plataforma VNR',
              quantity: 1,
              currency_id: 'ARS',
              unit_price: parseFloat(amount),
            },
          ],
          payer: {
            email: payerEmail,
            name: user?.nombre || 'Usuario',
            surname: user?.apellido || 'VNR',
          },
          back_urls: mpConfig.backUrls,
          auto_return: 'all',
          external_reference: externalReference,
          notification_url: mpConfig.notificationUrl,
          marketplace_fee: split.platformAmount,
          metadata: {
            user_id: userId,
            driver_id: driverId,
            service_type: serviceType,
            split_payment: true,
            ...metadata,
          },
          statement_descriptor: 'VNR',
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error MP Split Preference:', errorData);
        throw new Error(errorData.message || 'Error creando preferencia split');
      }

      const preference = await response.json();

      return {
        success: true,
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        isSplitPayment: true,
        split: {
          totalAmount: amount,
          platformFee: split.platformAmount,
          driverAmount: split.driverAmount,
          mpCollectorId: mpUserId,
        },
      };
    } catch (error) {
      console.error('Error creando preferencia split MP:', error);
      throw error;
    }
  },

  /**
   * Consultar estado de un pago
   */
  async getPaymentStatus(paymentId) {
    try {
      const payment = await paymentClient.get({ id: paymentId });

      return {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        paymentMethodId: payment.payment_method_id,
        paymentTypeId: payment.payment_type_id,
        externalReference: payment.external_reference,
        dateCreated: payment.date_created,
        dateApproved: payment.date_approved,
        metadata: payment.metadata,
      };
    } catch (error) {
      console.error('Error consultando estado de pago MP:', error);
      throw error;
    }
  },

  /**
   * Crear un reembolso
   */
  async createRefund(paymentId, amount = null) {
    try {
      const refundData = amount
        ? { amount: parseFloat(amount) }
        : {}; // Reembolso total si no se especifica monto

      const refund = await paymentClient.refund({
        id: paymentId,
        body: refundData,
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        dateCreated: refund.date_created,
      };
    } catch (error) {
      console.error('Error creando reembolso MP:', error);
      throw error;
    }
  },

  /**
   * Procesar notificacion webhook de MercadoPago
   */
  async processWebhook(data) {
    const { type, data: webhookData } = data;

    try {
      if (type === 'payment') {
        const paymentId = webhookData.id;
        const paymentStatus = await this.getPaymentStatus(paymentId);

        // Buscar el pago en nuestra BD por mp_payment_id
        const { data: payment, error } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('mp_payment_id', paymentId.toString())
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error buscando pago:', error);
        }

        if (payment) {
          // Actualizar estado del pago
          const newStatus = this.mapMPStatus(paymentStatus.status);

          await supabaseAdmin
            .from('payments')
            .update({
              status: newStatus,
              mp_status: paymentStatus.status,
              mp_status_detail: paymentStatus.statusDetail,
              paid_at: paymentStatus.dateApproved,
            })
            .eq('id', payment.id);

          return {
            processed: true,
            paymentId: payment.id,
            mpPaymentId: paymentId.toString(),
            newStatus,
          };
        }

        // Si no existe, podria ser un pago de preferencia
        // Buscar por external_reference
        if (paymentStatus.externalReference) {
          const { data: paymentByRef } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', paymentStatus.externalReference)
            .single();

          if (paymentByRef) {
            const newStatus = this.mapMPStatus(paymentStatus.status);

            await supabaseAdmin
              .from('payments')
              .update({
                status: newStatus,
                mp_payment_id: paymentId.toString(),
                mp_status: paymentStatus.status,
                mp_status_detail: paymentStatus.statusDetail,
                mp_payment_method_id: paymentStatus.paymentMethodId,
                mp_payment_type_id: paymentStatus.paymentTypeId,
                paid_at: paymentStatus.dateApproved,
              })
              .eq('id', paymentByRef.id);

            return {
              processed: true,
              paymentId: paymentByRef.id,
              mpPaymentId: paymentId.toString(),
              newStatus,
            };
          }
        }

        return { processed: false, reason: 'payment_not_found' };
      }

      return { processed: false, reason: 'unhandled_type' };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      throw error;
    }
  },

  /**
   * Mapear estado de MercadoPago a estado interno
   */
  mapMPStatus(mpStatus) {
    const statusMap = {
      approved: 'approved',
      pending: 'pending',
      in_process: 'processing',
      rejected: 'rejected',
      refunded: 'refunded',
      cancelled: 'cancelled',
      charged_back: 'refunded',
    };
    return statusMap[mpStatus] || 'pending';
  },

  /**
   * Obtener metodos de pago disponibles
   */
  async getPaymentMethods() {
    try {
      // Por ahora retornamos los metodos comunes en Argentina
      return [
        {
          id: 'credit_card',
          name: 'Tarjeta de Credito',
          paymentTypeId: 'credit_card',
          thumbnail: 'https://http2.mlstatic.com/storage/logos-api-admin/c846a10d-b0e5-4f2f-b1e9-c9e8c6a9e8f4-m.svg',
        },
        {
          id: 'debit_card',
          name: 'Tarjeta de Debito',
          paymentTypeId: 'debit_card',
          thumbnail: 'https://http2.mlstatic.com/storage/logos-api-admin/c846a10d-b0e5-4f2f-b1e9-c9e8c6a9e8f4-m.svg',
        },
        {
          id: 'account_money',
          name: 'Dinero en MercadoPago',
          paymentTypeId: 'account_money',
          thumbnail: 'https://http2.mlstatic.com/storage/logos-api-admin/51b446d0-571e-11e8-9a2d-4b2bd7b1bf77-m.svg',
        },
      ];
    } catch (error) {
      console.error('Error obteniendo metodos de pago:', error);
      throw error;
    }
  },

  /**
   * Verifica si un driver tiene MP conectado y activo
   * @param {string} driverId - ID del conductor
   * @returns {boolean} true si tiene MP conectado
   */
  async isDriverMPConnected(driverId) {
    try {
      const status = await mercadoPagoOAuthService.getConnectionStatus(driverId);
      return status.connected;
    } catch (error) {
      console.error('Error verificando conexión MP del driver:', error);
      return false;
    }
  },
};

export default mercadoPagoService;
