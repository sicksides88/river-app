import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Determinar si estamos en produccion o sandbox
const isProduction = process.env.NODE_ENV === 'production';

// Access Token segun ambiente
const accessToken = isProduction
  ? process.env.MP_ACCESS_TOKEN_PROD
  : process.env.MP_ACCESS_TOKEN_SANDBOX;

// Validar que existe el access token
if (!accessToken) {
  console.warn('⚠️  MercadoPago: No se encontro ACCESS_TOKEN. Configura MP_ACCESS_TOKEN_SANDBOX o MP_ACCESS_TOKEN_PROD en .env');
}

// Configuracion del cliente de MercadoPago
const mercadoPagoConfig = new MercadoPagoConfig({
  accessToken: accessToken || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000',
  options: {
    timeout: 5000,
  }
});

// Clientes de MercadoPago
export const paymentClient = new Payment(mercadoPagoConfig);
export const preferenceClient = new Preference(mercadoPagoConfig);

// Exportar configuracion para uso externo
export const mpConfig = {
  isProduction,
  publicKey: isProduction
    ? process.env.MP_PUBLIC_KEY_PROD
    : process.env.MP_PUBLIC_KEY_SANDBOX,
  webhookSecret: process.env.MP_WEBHOOK_SECRET,
  // URLs de retorno para Checkout Pro
  // Apuntan al backend, que redirige al deep link de la app mobile
  backUrls: {
    success: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/redirect/success`,
    failure: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/redirect/failure`,
    pending: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/redirect/pending`,
  },
  // Notificacion URL para webhooks
  notificationUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/webhook`,
};

// Configuración OAuth para conexión de drivers
export const mpOAuthConfig = {
  clientId: process.env.MP_CLIENT_ID || process.env.MP_APP_ID,
  clientSecret: process.env.MP_CLIENT_SECRET,
  redirectUri: process.env.MP_REDIRECT_URI || `${process.env.API_URL || 'http://localhost:5000'}/api/driver/mercadopago/callback`,
  authorizationUrl: 'https://auth.mercadopago.com/authorization',
  tokenUrl: 'https://api.mercadopago.com/oauth/token',
};

// Validar configuración OAuth
if (!mpOAuthConfig.clientId || !mpOAuthConfig.clientSecret) {
  console.warn('⚠️  MercadoPago OAuth: Faltan MP_CLIENT_ID o MP_CLIENT_SECRET en .env');
}

export default mercadoPagoConfig;
