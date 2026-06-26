/**
 * Utilidades de Testing para Pagos
 * Datos de prueba y helpers para testing en sandbox de MercadoPago
 */

// =====================================================
// TARJETAS DE PRUEBA MERCADOPAGO (Argentina)
// =====================================================
export const TEST_CARDS = {
  // Tarjetas que se APRUEBAN
  approved: {
    visa: {
      number: '4509953566233704',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'APRO',
      issuer: 'Visa',
    },
    mastercard: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'APRO',
      issuer: 'Mastercard',
    },
    amex: {
      number: '371180303257522',
      cvv: '1234',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'APRO',
      issuer: 'American Express',
    },
  },

  // Tarjetas que se RECHAZAN
  rejected: {
    insufficient_funds: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'FUND',
      issuer: 'Mastercard',
      reason: 'Fondos insuficientes',
    },
    call_for_auth: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'CALL',
      issuer: 'Mastercard',
      reason: 'Llamar para autorizar',
    },
    card_disabled: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'CARD',
      issuer: 'Mastercard',
      reason: 'Tarjeta deshabilitada',
    },
    security_code: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'SECU',
      issuer: 'Mastercard',
      reason: 'Código de seguridad inválido',
    },
    expired_card: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'EXPI',
      issuer: 'Mastercard',
      reason: 'Tarjeta expirada',
    },
    form_error: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'FORM',
      issuer: 'Mastercard',
      reason: 'Error de formulario',
    },
    generic_error: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'OTHE',
      issuer: 'Mastercard',
      reason: 'Error genérico',
    },
  },

  // Tarjetas que quedan PENDIENTES
  pending: {
    pending_contingency: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'CONT',
      issuer: 'Mastercard',
      reason: 'Pago pendiente de contingencia',
    },
    pending_review_manual: {
      number: '5031755734530604',
      cvv: '123',
      expiration_month: 11,
      expiration_year: 2025,
      holder_name: 'REVI',
      issuer: 'Mastercard',
      reason: 'Pago pendiente de revisión manual',
    },
  },
};

// =====================================================
// USUARIOS DE PRUEBA
// =====================================================
export const TEST_USERS = {
  payer: {
    email: 'test_user_12345678@testuser.com',
    first_name: 'Test',
    last_name: 'User',
    identification: {
      type: 'DNI',
      number: '12345678',
    },
  },
  seller: {
    email: 'test_seller_12345678@testuser.com',
    first_name: 'Test',
    last_name: 'Seller',
  },
};

// =====================================================
// MONTOS DE PRUEBA
// =====================================================
export const TEST_AMOUNTS = {
  minimum: 10,           // Monto mínimo
  small: 100,            // Viaje corto
  medium: 500,           // Viaje medio
  large: 2000,           // Viaje largo / flete
  maximum: 50000,        // Monto máximo típico
  tip_10: 50,            // Propina 10%
  tip_15: 75,            // Propina 15%
  tip_20: 100,           // Propina 20%
};

// =====================================================
// ESCENARIOS DE PRUEBA
// =====================================================
export const TEST_SCENARIOS = {
  // Flujo normal exitoso
  successful_wallet_payment: {
    description: 'Pago exitoso con wallet',
    steps: [
      '1. Usuario tiene saldo suficiente en wallet',
      '2. Solicita viaje',
      '3. Paga con wallet',
      '4. Pago se procesa inmediatamente',
      '5. Conductor recibe notificación de pago',
    ],
    expectedResult: 'Pago aprobado, saldo descontado, ganancia registrada',
  },

  successful_card_payment: {
    description: 'Pago exitoso con tarjeta',
    steps: [
      '1. Usuario solicita viaje',
      '2. Usa tarjeta de prueba APRO',
      '3. MercadoPago procesa el pago',
      '4. Webhook confirma aprobación',
      '5. Conductor recibe notificación',
    ],
    card: TEST_CARDS.approved.visa,
    expectedResult: 'Pago aprobado vía MercadoPago',
  },

  rejected_insufficient_funds: {
    description: 'Pago rechazado por fondos insuficientes',
    steps: [
      '1. Usuario solicita viaje',
      '2. Usa tarjeta de prueba FUND',
      '3. MercadoPago rechaza el pago',
      '4. Usuario ve mensaje de error',
    ],
    card: TEST_CARDS.rejected.insufficient_funds,
    expectedResult: 'Pago rechazado, mostrar mensaje apropiado',
  },

  double_charge_prevention: {
    description: 'Prevención de doble cobro',
    steps: [
      '1. Usuario hace click 2 veces en "Pagar"',
      '2. Primera solicitud se procesa',
      '3. Segunda solicitud se detecta como duplicada',
      '4. Solo se cobra una vez',
    ],
    expectedResult: 'Solo un pago procesado, segundo rechazado con 409',
  },

  rate_limit_exceeded: {
    description: 'Rate limit excedido',
    steps: [
      '1. Usuario hace más de 5 pagos en 1 minuto',
      '2. Sistema detecta rate limit',
      '3. Siguientes requests rechazados con 429',
    ],
    expectedResult: 'Error 429 Too Many Requests',
  },

  refund_full: {
    description: 'Reembolso total',
    steps: [
      '1. Usuario cancela antes de asignar conductor',
      '2. Sistema calcula 100% de reembolso',
      '3. Se procesa automáticamente',
      '4. Dinero vuelve a wallet',
    ],
    reason: 'cancelled_before_assignment',
    expectedResult: 'Reembolso total a wallet',
  },

  refund_partial: {
    description: 'Reembolso parcial',
    steps: [
      '1. Usuario cancela con conductor en camino',
      '2. Sistema calcula 50% de reembolso',
      '3. Admin puede aprobar/rechazar',
      '4. Si aprobado, dinero vuelve a wallet',
    ],
    reason: 'cancelled_driver_enroute',
    expectedResult: 'Reembolso del 50% después de aprobación',
  },

  webhook_invalid_signature: {
    description: 'Webhook con firma inválida',
    steps: [
      '1. Recibir webhook sin firma o firma incorrecta',
      '2. Sistema rechaza el webhook',
      '3. Se registra evento de seguridad',
    ],
    expectedResult: 'Webhook rechazado, log de seguridad creado',
  },
};

// =====================================================
// HELPERS DE TESTING
// =====================================================

/**
 * Generar datos de tarjeta para formulario
 * @param {string} type - 'approved' | 'rejected' | 'pending'
 * @param {string} card - Nombre de la tarjeta específica
 */
export const getTestCardData = (type, card) => {
  const cardData = TEST_CARDS[type]?.[card];
  if (!cardData) {
    throw new Error(`Tarjeta de prueba no encontrada: ${type}.${card}`);
  }
  return cardData;
};

/**
 * Generar payload de pago de prueba
 * @param {Object} options - Opciones
 */
export const generateTestPaymentPayload = (options = {}) => {
  const {
    amount = TEST_AMOUNTS.medium,
    paymentMethod = 'wallet',
    rideId = null,
    deliveryId = null,
    cardType = 'approved',
    cardName = 'visa',
  } = options;

  const payload = {
    amount,
    paymentMethod,
    rideId,
    deliveryId,
  };

  if (paymentMethod === 'card') {
    const card = getTestCardData(cardType, cardName);
    payload.cardData = {
      number: card.number,
      cvv: card.cvv,
      expirationMonth: card.expiration_month,
      expirationYear: card.expiration_year,
      holderName: card.holder_name,
    };
  }

  return payload;
};

/**
 * Simular webhook de MercadoPago
 * @param {string} paymentId - ID del pago
 * @param {string} status - 'approved' | 'rejected' | 'pending'
 */
export const generateMockWebhook = (paymentId, status = 'approved') => {
  return {
    type: 'payment',
    data: {
      id: paymentId,
    },
    action: 'payment.updated',
    api_version: 'v1',
    date_created: new Date().toISOString(),
    live_mode: false,
    user_id: 'test_user',
  };
};

/**
 * Verificar respuesta de pago
 * @param {Object} response - Respuesta de la API
 * @param {string} expectedStatus - Estado esperado
 */
export const assertPaymentResponse = (response, expectedStatus) => {
  const assertions = {
    success: response.success === true,
    hasPaymentId: !!response.payment?.id,
    statusMatch: response.payment?.status === expectedStatus,
  };

  const passed = Object.values(assertions).every(v => v);

  return {
    passed,
    assertions,
    message: passed
      ? 'Todas las aserciones pasaron'
      : `Falló: ${Object.entries(assertions).filter(([, v]) => !v).map(([k]) => k).join(', ')}`,
  };
};

// =====================================================
// DOCUMENTACIÓN DE TESTING
// =====================================================
export const TESTING_GUIDE = `
# Guía de Testing de Pagos - VNR

## Configuración

1. Asegúrate de tener configuradas las variables de entorno:
   - MP_ACCESS_TOKEN_SANDBOX
   - MP_PUBLIC_KEY_SANDBOX
   - MP_WEBHOOK_SECRET (opcional en desarrollo)

2. El sistema detecta automáticamente el ambiente según NODE_ENV

## Tarjetas de Prueba

### Para pagos APROBADOS:
- Visa: 4509 9535 6623 3704 (CVV: 123, Nombre: APRO)
- Mastercard: 5031 7557 3453 0604 (CVV: 123, Nombre: APRO)

### Para pagos RECHAZADOS:
- Fondos insuficientes: Nombre "FUND"
- Tarjeta expirada: Nombre "EXPI"
- CVV inválido: Nombre "SECU"

### Para pagos PENDIENTES:
- Pendiente contingencia: Nombre "CONT"
- Revisión manual: Nombre "REVI"

## Testing de Webhooks con ngrok

1. Instalar ngrok: npm install -g ngrok
2. Iniciar backend: npm run dev
3. Exponer puerto: ngrok http 5000
4. Copiar URL de ngrok
5. Configurar webhook en MercadoPago dashboard con la URL:
   https://xxxxx.ngrok.io/api/payments/webhook

## Escenarios a Probar

1. Pago exitoso con wallet
2. Pago exitoso con tarjeta
3. Pago rechazado (varias razones)
4. Prevención de doble cobro
5. Rate limiting
6. Reembolso total y parcial
7. Webhook con firma válida/inválida

## Logs de Auditoría

Revisar tabla payment_audit_logs para ver eventos de seguridad.
`;

export default {
  TEST_CARDS,
  TEST_USERS,
  TEST_AMOUNTS,
  TEST_SCENARIOS,
  getTestCardData,
  generateTestPaymentPayload,
  generateMockWebhook,
  assertPaymentResponse,
  TESTING_GUIDE,
};
