import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { mpConfig } from '../config/mercadopago.js';

/**
 * Middleware de Seguridad para Pagos
 * Implementa validaciones de seguridad para endpoints de pago
 */

// =====================================================
// RATE LIMITING
// =====================================================

// Store para rate limiting en memoria (en producción usar Redis)
const rateLimitStore = new Map();

// Limpiar store cada 15 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 900000);

/**
 * Rate limiting para endpoints de pago
 * @param {Object} options - Opciones de configuración
 * @param {number} options.windowMs - Ventana de tiempo en ms (default: 60000 = 1 min)
 * @param {number} options.max - Máximo de requests por ventana (default: 10)
 * @param {string} options.keyPrefix - Prefijo para la key (default: 'payment')
 */
export const paymentRateLimit = (options = {}) => {
  const {
    windowMs = 60000,
    max = 10,
    keyPrefix = 'payment',
  } = options;

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now - record.windowStart > windowMs) {
      record = {
        windowStart: now,
        count: 0,
      };
    }

    record.count++;
    rateLimitStore.set(key, record);

    // Headers de rate limit
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.windowStart + windowMs).toISOString());

    if (record.count > max) {
      // Log del intento de rate limit excedido
      logSecurityEvent('rate_limit_exceeded', {
        userId,
        endpoint: req.originalUrl,
        ip: req.ip,
        count: record.count,
      });

      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
        retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000),
      });
    }

    next();
  };
};

// =====================================================
// VALIDACIÓN DE WEBHOOK MERCADOPAGO
// =====================================================

/**
 * Validar firma de webhook de MercadoPago
 * MercadoPago envía x-signature header con formato: ts=TIMESTAMP,v1=HASH
 */
export const validateWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];

    // Si no hay firma, en desarrollo permitimos (para testing)
    if (!signature) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Webhook sin firma - permitido solo en desarrollo');
        return next();
      }

      logSecurityEvent('webhook_missing_signature', {
        ip: req.ip,
        requestId,
        headers: req.headers,
      });

      return res.status(401).json({
        success: false,
        message: 'Firma de webhook requerida',
      });
    }

    // Si no hay secret configurado
    if (!mpConfig.webhookSecret) {
      console.warn('⚠️  MP_WEBHOOK_SECRET no configurado');
      if (process.env.NODE_ENV === 'development') {
        return next();
      }
      return res.status(500).json({
        success: false,
        message: 'Configuración de webhook incompleta',
      });
    }

    // Parsear signature: ts=TIMESTAMP,v1=HASH
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !hash) {
      logSecurityEvent('webhook_invalid_signature_format', {
        ip: req.ip,
        signature,
        requestId,
      });

      return res.status(401).json({
        success: false,
        message: 'Formato de firma inválido',
      });
    }

    // Verificar que el timestamp no sea muy viejo (5 minutos max)
    const timestampMs = parseInt(timestamp) * 1000;
    const fiveMinutesAgo = Date.now() - 300000;

    if (timestampMs < fiveMinutesAgo) {
      logSecurityEvent('webhook_expired_timestamp', {
        ip: req.ip,
        timestamp,
        requestId,
      });

      return res.status(401).json({
        success: false,
        message: 'Webhook expirado',
      });
    }

    // Construir el payload para verificar
    // MercadoPago usa: id=[data.id]&ts=TIMESTAMP
    const dataId = req.body?.data?.id || req.query?.['data.id'] || '';
    const manifest = `id=${dataId};request-id=${requestId};ts=${timestamp};`;

    // Calcular HMAC
    const expectedHash = crypto
      .createHmac('sha256', mpConfig.webhookSecret)
      .update(manifest)
      .digest('hex');

    if (hash !== expectedHash) {
      logSecurityEvent('webhook_signature_mismatch', {
        ip: req.ip,
        requestId,
        dataId,
      });

      return res.status(401).json({
        success: false,
        message: 'Firma de webhook inválida',
      });
    }

    // Firma válida
    req.webhookValidated = true;
    next();
  } catch (error) {
    console.error('Error validando webhook:', error);

    // En caso de error, en desarrollo permitimos
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    res.status(500).json({
      success: false,
      message: 'Error validando webhook',
    });
  }
};

// =====================================================
// VALIDACIÓN DE MONTOS
// =====================================================

/**
 * Validar monto de pago
 */
export const validatePaymentAmount = (options = {}) => {
  const {
    minAmount = 1,
    maxAmount = 1000000,
    field = 'amount',
  } = options;

  return (req, res, next) => {
    const amount = parseFloat(req.body[field]);

    if (isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: `${field} debe ser un número válido`,
      });
    }

    if (amount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `El monto mínimo es $${minAmount}`,
      });
    }

    if (amount > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `El monto máximo es $${maxAmount}`,
      });
    }

    // Validar que no tenga más de 2 decimales
    if (!Number.isInteger(amount * 100)) {
      return res.status(400).json({
        success: false,
        message: 'El monto no puede tener más de 2 decimales',
      });
    }

    next();
  };
};

// =====================================================
// PREVENCIÓN DE DOBLE COBRO
// =====================================================

// Store para idempotencia (en producción usar Redis)
const idempotencyStore = new Map();

// Limpiar store cada hora
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, data] of idempotencyStore.entries()) {
    if (data.timestamp < oneHourAgo) {
      idempotencyStore.delete(key);
    }
  }
}, 3600000);

/**
 * Middleware de idempotencia para prevenir doble cobro
 * Usa el header X-Idempotency-Key o genera uno basado en los datos
 */
export const preventDoubleCharge = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { rideId, deliveryId, amount } = req.body;

    // Generar key de idempotencia
    let idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      // Generar basado en los datos del request
      idempotencyKey = crypto
        .createHash('sha256')
        .update(`${userId}:${rideId || ''}:${deliveryId || ''}:${amount}`)
        .digest('hex');
    }

    // Verificar si ya existe una transacción reciente
    const existingRequest = idempotencyStore.get(idempotencyKey);

    if (existingRequest) {
      // Si ya se procesó, devolver el resultado anterior
      if (existingRequest.completed) {
        logSecurityEvent('duplicate_payment_prevented', {
          userId,
          idempotencyKey,
          originalResponse: existingRequest.response,
        });

        return res.status(200).json(existingRequest.response);
      }

      // Si está en proceso, rechazar
      if (existingRequest.processing) {
        return res.status(409).json({
          success: false,
          message: 'Pago en proceso. Por favor espera.',
        });
      }
    }

    // También verificar en la base de datos para pagos del mismo servicio
    if (rideId || deliveryId) {
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id, status, created_at')
        .or(`ride_id.eq.${rideId || 'null'},delivery_id.eq.${deliveryId || 'null'}`)
        .in('status', ['pending', 'processing', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingPayment) {
        // Verificar si el pago es reciente (últimos 5 minutos)
        const paymentAge = Date.now() - new Date(existingPayment.created_at).getTime();

        if (paymentAge < 300000 && existingPayment.status !== 'approved') {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un pago pendiente para este servicio',
            existingPaymentId: existingPayment.id,
          });
        }

        if (existingPayment.status === 'approved') {
          return res.status(409).json({
            success: false,
            message: 'Este servicio ya fue pagado',
            existingPaymentId: existingPayment.id,
          });
        }
      }
    }

    // Marcar como en proceso
    idempotencyStore.set(idempotencyKey, {
      timestamp: Date.now(),
      processing: true,
      completed: false,
    });

    // Guardar key para actualizar después
    req.idempotencyKey = idempotencyKey;

    // Interceptar la respuesta para guardarla
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      idempotencyStore.set(idempotencyKey, {
        timestamp: Date.now(),
        processing: false,
        completed: true,
        response: body,
      });
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Error en prevención de doble cobro:', error);
    next();
  }
};

// =====================================================
// AUDITORÍA DE TRANSACCIONES
// =====================================================

/**
 * Log de eventos de seguridad
 * @param {string} eventType - Tipo de evento
 * @param {Object} data - Datos del evento
 */
export const logSecurityEvent = async (eventType, data) => {
  try {
    const event = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      data,
      environment: process.env.NODE_ENV,
    };

    // Log a consola
    console.log(`[SECURITY] ${eventType}:`, JSON.stringify(data));

    // Guardar en base de datos
    await supabaseAdmin
      .from('payment_audit_logs')
      .insert({
        event_type: eventType,
        user_id: data.userId || null,
        payment_id: data.paymentId || null,
        ip_address: data.ip || null,
        details: data,
      })
      .then(() => {})
      .catch((err) => {
        // Si la tabla no existe, solo loggear
        if (err.code !== '42P01') {
          console.error('Error guardando audit log:', err);
        }
      });
  } catch (error) {
    console.error('Error en logSecurityEvent:', error);
  }
};

/**
 * Middleware de auditoría para pagos
 */
export const auditPayment = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Interceptar respuesta
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      const duration = Date.now() - startTime;

      await logSecurityEvent('payment_action', {
        action,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl,
        method: req.method,
        requestBody: sanitizeRequestBody(req.body),
        responseStatus: res.statusCode,
        responseSuccess: body?.success,
        duration,
        paymentId: body?.payment?.id,
      });

      return originalJson(body);
    };

    next();
  };
};

/**
 * Sanitizar body del request para logging (ocultar datos sensibles)
 */
const sanitizeRequestBody = (body) => {
  if (!body) return null;

  const sanitized = { ...body };

  // Ocultar datos sensibles
  const sensitiveFields = ['token', 'cvv', 'card_number', 'password', 'secret'];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

// =====================================================
// VALIDACIÓN DE SERVICIO
// =====================================================

/**
 * Validar que el servicio existe y pertenece al usuario
 */
export const validateServiceOwnership = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { rideId, deliveryId } = req.body;

    if (!rideId && !deliveryId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere rideId o deliveryId',
      });
    }

    if (rideId) {
      const { data: ride, error } = await supabaseAdmin
        .from('rides')
        .select('id, user_id, status, actual_price, estimated_price')
        .eq('id', rideId)
        .single();

      if (error || !ride) {
        return res.status(404).json({
          success: false,
          message: 'Viaje no encontrado',
        });
      }

      if (ride.user_id !== userId) {
        logSecurityEvent('unauthorized_payment_attempt', {
          userId,
          rideId,
          rideOwner: ride.user_id,
        });

        return res.status(403).json({
          success: false,
          message: 'No autorizado para este viaje',
        });
      }

      // Validar que el monto coincida con el precio del viaje
      const expectedAmount = ride.actual_price || ride.estimated_price;
      const requestedAmount = parseFloat(req.body.amount);

      if (expectedAmount && Math.abs(requestedAmount - expectedAmount) > 0.01) {
        logSecurityEvent('amount_mismatch', {
          userId,
          rideId,
          expectedAmount,
          requestedAmount,
        });

        return res.status(400).json({
          success: false,
          message: 'El monto no coincide con el precio del viaje',
          expected: expectedAmount,
        });
      }

      req.service = ride;
    }

    if (deliveryId) {
      const { data: delivery, error } = await supabaseAdmin
        .from('deliveries')
        .select('id, user_id, status, actual_price, estimated_price')
        .eq('id', deliveryId)
        .single();

      if (error || !delivery) {
        return res.status(404).json({
          success: false,
          message: 'Envío no encontrado',
        });
      }

      if (delivery.user_id !== userId) {
        logSecurityEvent('unauthorized_payment_attempt', {
          userId,
          deliveryId,
          deliveryOwner: delivery.user_id,
        });

        return res.status(403).json({
          success: false,
          message: 'No autorizado para este envío',
        });
      }

      req.service = delivery;
    }

    next();
  } catch (error) {
    console.error('Error validando servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error validando servicio',
    });
  }
};

export default {
  paymentRateLimit,
  validateWebhookSignature,
  validatePaymentAmount,
  preventDoubleCharge,
  logSecurityEvent,
  auditPayment,
  validateServiceOwnership,
};
