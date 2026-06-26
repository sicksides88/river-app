import { supabaseAdmin } from '../config/supabase.js';
import mercadoPagoService from '../services/mercadopago.service.js';
import mercadoPagoOAuthService from '../services/mercadopagoOAuth.service.js';
import walletService from '../services/wallet.service.js';
import driverWalletService from '../services/driverWallet.service.js';
import paymentSplitService from '../services/paymentSplit.service.js';
import notificationService from '../services/notification.service.js';
import { emitToUser } from '../config/socket.js';

// @desc    Procesar pago de un viaje/envio
// @route   POST /api/payments/process
// @access  Private
export const processPayment = async (req, res) => {
  try {
    const {
      rideId,
      deliveryId,
      amount,
      paymentMethod, // 'wallet', 'mercadopago', 'cash'
    } = req.body;

    const userId = req.user.id;

    // Validar que tiene referencia a un servicio
    if (!rideId && !deliveryId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere rideId o deliveryId',
      });
    }

    // Validar monto
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto invalido',
      });
    }

    // Obtener informacion del servicio
    let service = null;
    let serviceType = null;
    let driverId = null;

    if (rideId) {
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .eq('user_id', userId)
        .single();

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Viaje no encontrado',
        });
      }

      service = ride;
      serviceType = ride.service_type;
      driverId = ride.driver_id;
    } else if (deliveryId) {
      const { data: delivery } = await supabaseAdmin
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .eq('user_id', userId)
        .single();

      if (!delivery) {
        return res.status(404).json({
          success: false,
          message: 'Envio no encontrado',
        });
      }

      service = delivery;
      serviceType = delivery.service_type;
      driverId = delivery.driver_id;
    }

    // Buscar payment pendiente existente (creado al solicitar el servicio)
    let payment;
    const existingQuery = supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (rideId) existingQuery.eq('ride_id', rideId);
    if (deliveryId) existingQuery.eq('delivery_id', deliveryId);

    const { data: existingPayment } = await existingQuery.single();

    if (existingPayment) {
      // Reusar payment existente, actualizar con driver y monto actual
      const { data: updatedPayment, error: updateErr } = await supabaseAdmin
        .from('payments')
        .update({
          driver_id: driverId,
          amount,
          payment_method: paymentMethod,
        })
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      payment = updatedPayment;
    } else {
      // Crear nuevo registro de pago
      const { data: newPayment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          ride_id: rideId,
          delivery_id: deliveryId,
          user_id: userId,
          driver_id: driverId,
          amount,
          payment_method: paymentMethod,
          status: 'pending',
          description: `Pago por ${rideId ? 'viaje' : 'envio'}`,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;
      payment = newPayment;
    }

    let paymentResult;

    switch (paymentMethod) {
      case 'wallet':
        // Pagar con saldo del wallet
        paymentResult = await walletService.pay(
          userId,
          amount,
          rideId ? 'ride' : 'delivery',
          rideId || deliveryId,
          `Pago por ${rideId ? 'viaje' : 'envio'}`
        );

        // Actualizar estado del pago
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'approved',
            paid_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        // Registrar ganancia del conductor
        if (driverId) {
          await driverWalletService.addEarning({
            driverId,
            rideId,
            deliveryId,
            paymentId: payment.id,
            grossAmount: amount,
            serviceType: serviceType?.replace('-', '_') || 'vuelta_segura',
          });

          // Notificar al conductor sobre el pago recibido
          try {
            await notificationService.sendPaymentReceived(driverId, {
              paymentId: payment.id,
              amount,
              serviceType: rideId ? 'ride' : 'delivery',
              serviceId: rideId || deliveryId,
            });

            // Emitir evento WebSocket al conductor
            emitToUser(driverId, 'payment:received', {
              paymentId: payment.id,
              amount,
              serviceType: rideId ? 'ride' : 'delivery',
              serviceId: rideId || deliveryId,
            });
          } catch (notificationError) {
            console.error('Error sending payment notification:', notificationError);
          }
        }

        break;

      case 'mercadopago': {
        // Crear preferencia de Checkout Pro (sandbox o producción)
        let preferenceResult;
        let usedSplitPreference = false;

        // Intentar split payment si el driver tiene MP conectado
        if (driverId) {
          try {
            const mpStatus = await mercadoPagoOAuthService.getConnectionStatus(driverId);
            if (mpStatus.connected) {
              console.log('[MP] Creando preferencia con SPLIT para driver:', driverId);
              preferenceResult = await mercadoPagoService.createPreferenceWithSplit({
                driverId,
                userId,
                amount,
                title: rideId ? 'Pago de viaje VNR' : 'Pago de envio VNR',
                description: `Pago por servicio - ${service.pickup_address} a ${service.dropoff_address}`,
                externalReference: payment.id,
                serviceType: serviceType?.replace('-', '_') || 'vuelta_segura',
                metadata: {
                  ride_id: rideId,
                  delivery_id: deliveryId,
                },
              });
              usedSplitPreference = true;
            }
          } catch (splitError) {
            console.error('[MP] Error en split preference, usando fallback normal:', splitError);
            usedSplitPreference = false;
          }
        }

        // Fallback: preferencia normal si no hay split o falló
        if (!usedSplitPreference) {
          console.log('[MP] Creando preferencia NORMAL');
          preferenceResult = await mercadoPagoService.createPreference({
            userId,
            amount,
            title: rideId ? 'Pago de viaje VNR' : 'Pago de envio VNR',
            description: `Pago por servicio - ${service.pickup_address} a ${service.dropoff_address}`,
            externalReference: payment.id,
            metadata: {
              ride_id: rideId,
              delivery_id: deliveryId,
              driver_id: driverId,
              service_type: serviceType,
            },
          });
        }

        // Actualizar pago con datos de preferencia
        await supabaseAdmin
          .from('payments')
          .update({
            mp_preference_id: preferenceResult.preferenceId,
            metadata: {
              split_payment: usedSplitPreference,
            },
          })
          .eq('id', payment.id);

        paymentResult = {
          preferenceId: preferenceResult.preferenceId,
          initPoint: preferenceResult.initPoint,
          sandboxInitPoint: preferenceResult.sandboxInitPoint,
        };
        break;
      }

      case 'cash':
        // Pago en efectivo (solo marcar como pendiente de cobro)
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'pending',
            metadata: { cash_payment: true },
          })
          .eq('id', payment.id);

        paymentResult = {
          message: 'Pago en efectivo registrado. Cobrar al finalizar el servicio.',
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Metodo de pago no soportado',
        });
    }

    res.status(201).json({
      success: true,
      message: 'Pago procesado',
      payment: {
        id: payment.id,
        amount,
        paymentMethod,
        status: paymentMethod === 'wallet' ? 'approved' : 'pending',
      },
      ...paymentResult,
    });
  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando pago',
      error: error.message,
    });
  }
};

// @desc    Webhook de MercadoPago
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook recibido:', type, data);

    if (type === 'payment') {
      const result = await mercadoPagoService.processWebhook({ type, data });

      // Si el pago fue aprobado, registrar ganancia del conductor
      if (result.processed && result.newStatus === 'approved') {
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('id', result.paymentId)
          .single();

        if (payment && payment.driver_id) {
          const isSplitPayment = payment.metadata?.split_payment === true;

          // Obtener tipo de servicio
          let serviceType = 'vuelta_segura';
          if (payment.ride_id) {
            const { data: ride } = await supabaseAdmin
              .from('rides')
              .select('service_type')
              .eq('id', payment.ride_id)
              .single();
            serviceType = ride?.service_type?.replace('-', '_') || 'vuelta_segura';
          } else if (payment.delivery_id) {
            const { data: delivery } = await supabaseAdmin
              .from('deliveries')
              .select('service_type')
              .eq('id', payment.delivery_id)
              .single();
            serviceType = delivery?.service_type?.replace('-', '_') || 'envios';
          }

          let driverAmount = parseFloat(payment.amount);

          if (isSplitPayment) {
            // Split payment: registrar en payment_splits (el dinero ya fue al driver via MP)
            const mpUserId = await mercadoPagoOAuthService.getMPUserId(payment.driver_id);
            const split = await paymentSplitService.calculateSplit(parseFloat(payment.amount), serviceType);
            driverAmount = split.driverAmount;

            await paymentSplitService.recordSplitWithMP({
              paymentId: payment.id,
              rideId: payment.ride_id,
              deliveryId: payment.delivery_id,
              driverId: payment.driver_id,
              userId: payment.user_id,
              serviceType,
              totalAmount: parseFloat(payment.amount),
              mpPaymentId: result.mpPaymentId,
              mpApplicationFee: split.platformAmount,
              mpCollectorId: mpUserId,
            });
          } else {
            // Pago normal: registrar ganancia en wallet interna del driver
            await driverWalletService.addEarning({
              driverId: payment.driver_id,
              rideId: payment.ride_id,
              deliveryId: payment.delivery_id,
              paymentId: payment.id,
              grossAmount: parseFloat(payment.amount),
              serviceType,
            });
          }

          // Notificar al conductor sobre el pago recibido (ambos casos)
          try {

            await notificationService.sendPaymentReceived(payment.driver_id, {
              paymentId: payment.id,
              amount: driverAmount,
              serviceType: payment.ride_id ? 'ride' : 'delivery',
              serviceId: payment.ride_id || payment.delivery_id,
              isSplitPayment,
            });

            // Emitir evento WebSocket al conductor
            emitToUser(payment.driver_id, 'payment:received', {
              paymentId: payment.id,
              amount: driverAmount,
              serviceType: payment.ride_id ? 'ride' : 'delivery',
              serviceId: payment.ride_id || payment.delivery_id,
              isSplitPayment,
            });
          } catch (notificationError) {
            console.error('Error sending payment notification:', notificationError);
          }
        }
      }

      return res.status(200).json({ received: true, ...result });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    // Siempre responder 200 para que MP no reintente
    res.status(200).json({ received: true, error: error.message });
  }
};

// @desc    Obtener detalle de un pago
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        ride:ride_id(id, pickup_address, dropoff_address, service_type),
        delivery:delivery_id(id, pickup_address, dropoff_address, service_type),
        driver:driver_id(id, nombre, apellido, avatar)
      `)
      .eq('id', id)
      .or(`user_id.eq.${userId},driver_id.eq.${userId}`)
      .single();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pago',
      error: error.message,
    });
  }
};

// @desc    Obtener historial de pagos del usuario
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        ride:ride_id(id, pickup_address, dropoff_address),
        delivery:delivery_id(id, pickup_address, dropoff_address)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      payments,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pagos',
      error: error.message,
    });
  }
};

// @desc    Obtener metodos de pago disponibles
// @route   GET /api/payments/methods
// @access  Private
export const getPaymentMethods = async (req, res) => {
  try {
    const methods = await mercadoPagoService.getPaymentMethods();

    // Agregar wallet como metodo de pago
    const walletBalance = await walletService.getBalance(req.user.id);

    res.json({
      success: true,
      methods: [
        {
          id: 'wallet',
          name: 'Saldo VNR',
          paymentTypeId: 'wallet',
          balance: walletBalance.balance,
          available: walletBalance.isActive,
        },
        ...methods,
        {
          id: 'cash',
          name: 'Efectivo',
          paymentTypeId: 'cash',
        },
      ],
    });
  } catch (error) {
    console.error('Error obteniendo metodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo metodos de pago',
      error: error.message,
    });
  }
};
