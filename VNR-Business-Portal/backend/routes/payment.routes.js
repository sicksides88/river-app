import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  paymentRateLimit,
  validateWebhookSignature,
  validatePaymentAmount,
  preventDoubleCharge,
  auditPayment,
  validateServiceOwnership,
} from '../middleware/payment.security.js';
import {
  processPayment,
  handleWebhook,
  getPayment,
  getPayments,
  getPaymentMethods,
} from '../controllers/payment.controller.js';
import { supabaseAdmin } from '../config/supabase.js';
import { mpConfig } from '../config/mercadopago.js';
import mercadoPagoService from '../services/mercadopago.service.js';
import mercadoPagoOAuthService from '../services/mercadopagoOAuth.service.js';
import driverWalletService from '../services/driverWallet.service.js';
import paymentSplitService from '../services/paymentSplit.service.js';
import notificationService from '../services/notification.service.js';
import { emitToUser } from '../config/socket.js';

const router = express.Router();

// =====================================================
// WEBHOOK DE MERCADOPAGO (público)
// =====================================================
router.post(
  '/webhook',
  validateWebhookSignature,
  auditPayment('webhook_received'),
  handleWebhook
);

// =====================================================
// REDIRECT ENDPOINTS para back_urls de MercadoPago
// Redirigen al deep link de la app mobile
// =====================================================
const APP_DEEP_LINK = process.env.APP_DEEP_LINK || 'vnr://';

// Helper: página HTML que redirige a la app (bypasea interstitial de ngrok)
const redirectPage = (deepLink, status) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Volviendo a VNR...</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; text-align: center; }
    .container { padding: 2rem; }
    h2 { color: ${status === 'success' ? '#22c55e' : status === 'failure' ? '#ef4444' : '#f59e0b'}; }
    a { display: inline-block; margin-top: 1rem; padding: 12px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 25px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h2>${status === 'success' ? 'Pago aprobado' : status === 'failure' ? 'Pago rechazado' : 'Pago pendiente'}</h2>
    <p>Redirigiendo a la app...</p>
    <a href="${deepLink}">Volver a VNR</a>
  </div>
  <script>
    setTimeout(function() { window.location.href = "${deepLink}"; }, 500);
  </script>
</body>
</html>`;

router.get('/redirect/success', async (req, res) => {
  const { payment_id, external_reference } = req.query;
  console.log(`✅ MP redirect success - payment_id: ${payment_id}, ref: ${external_reference}`);

  // Procesar el pago en background (no bloquear el redirect al usuario)
  if (payment_id && external_reference) {
    processPaymentOnRedirect(payment_id, external_reference).catch(err =>
      console.error('[Redirect] Error procesando pago:', err)
    );
  }

  const deepLink = `${APP_DEEP_LINK}payment/success?payment_id=${payment_id || ''}&ref=${external_reference || ''}`;
  res.send(redirectPage(deepLink, 'success'));
});

/**
 * Procesa el pago cuando MP redirige al usuario (no depender solo del webhook)
 */
async function processPaymentOnRedirect(mpPaymentId, externalReference) {
  try {
    // Buscar payment en nuestra DB
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', externalReference)
      .single();

    if (!payment) {
      console.log('[Redirect] Payment no encontrado para ref:', externalReference);
      return;
    }

    // Si ya fue procesado, no duplicar
    if (payment.status === 'approved' && payment.mp_payment_id) {
      console.log('[Redirect] Payment ya procesado:', payment.id);
      return;
    }

    // Consultar estado real del pago en MP
    const mpStatus = await mercadoPagoService.getPaymentStatus(mpPaymentId);
    const newStatus = mercadoPagoService.mapMPStatus(mpStatus.status);

    console.log(`[Redirect] MP status: ${mpStatus.status} -> ${newStatus} para payment ${payment.id}`);

    // Actualizar payment en DB
    await supabaseAdmin
      .from('payments')
      .update({
        status: newStatus,
        mp_payment_id: mpPaymentId.toString(),
        mp_status: mpStatus.status,
        mp_status_detail: mpStatus.statusDetail,
        mp_payment_method_id: mpStatus.paymentMethodId,
        mp_payment_type_id: mpStatus.paymentTypeId,
        paid_at: mpStatus.dateApproved || new Date().toISOString(),
      })
      .eq('id', payment.id);

    // Si fue aprobado, registrar ganancia/split del conductor
    if (newStatus === 'approved' && payment.driver_id) {
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
        // Split: el dinero ya fue al driver via MP, registrar en payment_splits
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
          mpPaymentId: mpPaymentId.toString(),
          mpApplicationFee: split.platformAmount,
          mpCollectorId: mpUserId,
        });

        console.log(`[Redirect] Split registrado - driver: ${driverAmount}, plataforma: ${split.platformAmount}`);
      } else {
        // Pago normal: registrar ganancia en wallet interna
        await driverWalletService.addEarning({
          driverId: payment.driver_id,
          rideId: payment.ride_id,
          deliveryId: payment.delivery_id,
          paymentId: payment.id,
          grossAmount: parseFloat(payment.amount),
          serviceType,
        });

        console.log(`[Redirect] Earning registrado en wallet interna: ${payment.amount}`);
      }

      // Notificar al conductor
      try {
        await notificationService.sendPaymentReceived(payment.driver_id, {
          paymentId: payment.id,
          amount: driverAmount,
          serviceType: payment.ride_id ? 'ride' : 'delivery',
          serviceId: payment.ride_id || payment.delivery_id,
          isSplitPayment,
        });

        emitToUser(payment.driver_id, 'payment:received', {
          paymentId: payment.id,
          amount: driverAmount,
          serviceType: payment.ride_id ? 'ride' : 'delivery',
          serviceId: payment.ride_id || payment.delivery_id,
          isSplitPayment,
        });
      } catch (notifErr) {
        console.error('[Redirect] Error notificando al driver:', notifErr);
      }
    }

    console.log(`[Redirect] Pago ${payment.id} procesado exitosamente`);
  } catch (error) {
    console.error('[Redirect] Error en processPaymentOnRedirect:', error);
  }
}

router.get('/redirect/failure', (req, res) => {
  const { payment_id, external_reference } = req.query;
  console.log(`❌ MP redirect failure - payment_id: ${payment_id}, ref: ${external_reference}`);
  const deepLink = `${APP_DEEP_LINK}payment/failure?payment_id=${payment_id || ''}&ref=${external_reference || ''}`;
  res.send(redirectPage(deepLink, 'failure'));
});

router.get('/redirect/pending', (req, res) => {
  const { payment_id, external_reference } = req.query;
  console.log(`⏳ MP redirect pending - payment_id: ${payment_id}, ref: ${external_reference}`);
  const deepLink = `${APP_DEEP_LINK}payment/pending?payment_id=${payment_id || ''}&ref=${external_reference || ''}`;
  res.send(redirectPage(deepLink, 'pending'));
});

// =====================================================
// RUTAS PROTEGIDAS
// =====================================================
router.use(protect);

// Obtener configuración pública de MercadoPago (public key)
router.get(
  '/config',
  paymentRateLimit({ max: 30, windowMs: 60000 }),
  (req, res) => {
    res.json({
      publicKey: mpConfig.publicKey,
      isProduction: mpConfig.isProduction,
    });
  }
);

// Obtener métodos de pago disponibles
router.get(
  '/methods',
  paymentRateLimit({ max: 30, windowMs: 60000 }),
  getPaymentMethods
);

// Procesar un pago - Máxima seguridad
router.post(
  '/process',
  paymentRateLimit({ max: 5, windowMs: 60000, keyPrefix: 'payment_process' }),
  validatePaymentAmount({ minAmount: 1, maxAmount: 500000 }),
  validateServiceOwnership,
  preventDoubleCharge,
  auditPayment('payment_process'),
  processPayment
);

// Obtener historial de pagos
router.get(
  '/',
  paymentRateLimit({ max: 30, windowMs: 60000 }),
  getPayments
);

// Obtener detalle de un pago
router.get(
  '/:id',
  paymentRateLimit({ max: 30, windowMs: 60000 }),
  getPayment
);

export default router;
