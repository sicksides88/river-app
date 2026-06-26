import mercadoPagoOAuthService from '../services/mercadopagoOAuth.service.js';

/**
 * @desc    Obtener URL de autorización para conectar MP
 * @route   GET /api/driver/mercadopago/connect
 * @access  Private (Driver)
 */
export const getConnectUrl = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Verificar si ya tiene cuenta conectada
    const status = await mercadoPagoOAuthService.getConnectionStatus(driverId);

    if (status.connected) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una cuenta de MercadoPago conectada',
        status,
      });
    }

    // Generar URL de autorización
    const { url, state } = mercadoPagoOAuthService.getAuthorizationUrl(driverId);

    res.json({
      success: true,
      authorizationUrl: url,
      state,
    });
  } catch (error) {
    console.error('Error generando URL de conexión:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando URL de conexión',
      error: error.message,
    });
  }
};

/**
 * @desc    Callback de OAuth de MercadoPago
 * @route   GET /api/driver/mercadopago/callback
 * @access  Public (redirigido desde MP)
 */
export const handleCallback = async (req, res) => {
  const { code, state, error: mpError, error_description } = req.query;

  const sendPage = (title, message, isError = false) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .container { text-align: center; padding: 20px; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { color: #333; margin-bottom: 8px; }
          p { color: #666; font-size: 16px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${isError ? '❌' : '✅'}</div>
          <h2>${title}</h2>
          <p>${message}</p>
          <p style="margin-top: 20px; color: #999;">Puedes cerrar esta ventana y volver a la app.</p>
        </div>
      </body>
      </html>
    `);
  };

  try {
    // Si MP retorna error
    if (mpError) {
      console.error('Error de MP OAuth:', mpError, error_description);
      return sendPage('Error de conexión', error_description || mpError, true);
    }

    if (!code || !state) {
      return sendPage('Error', 'Parámetros inválidos', true);
    }

    // Decodificar state para obtener driverId
    const stateData = mercadoPagoOAuthService.decodeState(state);

    if (!stateData || !stateData.driverId) {
      return sendPage('Error', 'Estado inválido', true);
    }

    // Verificar que el state no sea muy antiguo (15 minutos)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 15 * 60 * 1000) {
      return sendPage('Sesión expirada', 'Vuelve a la app e intenta conectar nuevamente.', true);
    }

    // Intercambiar código por tokens
    const tokenData = await mercadoPagoOAuthService.exchangeCodeForTokens(code);

    if (!tokenData.success) {
      return sendPage('Error', 'No se pudieron obtener los tokens de MercadoPago.', true);
    }

    // Guardar credenciales
    const result = await mercadoPagoOAuthService.saveCredentials(stateData.driverId, tokenData);

    if (!result.success) {
      return sendPage('Error', 'No se pudieron guardar las credenciales.', true);
    }

    sendPage('Cuenta conectada', `Tu cuenta de MercadoPago (${result.account.mpEmail || ''}) fue vinculada correctamente. Vuelve a la app y actualizá la pantalla.`);
  } catch (error) {
    console.error('Error en callback OAuth:', error);
    sendPage('Error', error.message || 'Ocurrió un error inesperado.', true);
  }
};

/**
 * @desc    Intercambiar código OAuth por tokens (llamado desde el frontend)
 * @route   POST /api/driver/mercadopago/exchange
 * @access  Private (Driver)
 */
export const exchangeCode = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Código y state son requeridos',
      });
    }

    // Decodificar state
    const stateData = mercadoPagoOAuthService.decodeState(state);

    if (!stateData || !stateData.driverId) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
      });
    }

    // Verificar que el state pertenece a este driver
    if (stateData.driverId !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado',
      });
    }

    // Verificar que el state no sea muy antiguo (15 minutos)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'La sesión ha expirado, intenta de nuevo',
      });
    }

    // Intercambiar código por tokens
    const tokenData = await mercadoPagoOAuthService.exchangeCodeForTokens(code);

    if (!tokenData.success) {
      return res.status(400).json({
        success: false,
        message: 'Error obteniendo tokens de MercadoPago',
      });
    }

    // Guardar credenciales
    const result = await mercadoPagoOAuthService.saveCredentials(driverId, tokenData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error guardando credenciales',
      });
    }

    res.json({
      success: true,
      message: 'Cuenta de MercadoPago conectada correctamente',
      mpEmail: result.account.mpEmail,
    });
  } catch (error) {
    console.error('Error en exchange OAuth:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al conectar cuenta',
    });
  }
};

/**
 * @desc    Desconectar cuenta de MercadoPago
 * @route   POST /api/driver/mercadopago/disconnect
 * @access  Private (Driver)
 */
export const disconnectAccount = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Verificar si tiene cuenta conectada
    const status = await mercadoPagoOAuthService.getConnectionStatus(driverId);

    if (!status.connected && status.status === 'not_connected') {
      return res.status(400).json({
        success: false,
        message: 'No tienes una cuenta de MercadoPago conectada',
      });
    }

    // Desconectar cuenta
    const result = await mercadoPagoOAuthService.disconnectAccount(driverId);

    res.json({
      success: true,
      message: 'Cuenta de MercadoPago desconectada correctamente',
    });
  } catch (error) {
    console.error('Error desconectando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error desconectando cuenta',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener estado de conexión de MercadoPago
 * @route   GET /api/driver/mercadopago/status
 * @access  Private (Driver)
 */
export const getStatus = async (req, res) => {
  try {
    const driverId = req.user.id;

    const status = await mercadoPagoOAuthService.getConnectionStatus(driverId);

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado de conexión',
      error: error.message,
    });
  }
};

/**
 * @desc    Refrescar token manualmente (para testing/admin)
 * @route   POST /api/driver/mercadopago/refresh
 * @access  Private (Driver)
 */
export const refreshToken = async (req, res) => {
  try {
    const driverId = req.user.id;

    const result = await mercadoPagoOAuthService.refreshAccessToken(driverId);

    res.json({
      success: true,
      message: 'Token refrescado correctamente',
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Error refrescando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error refrescando token',
      error: error.message,
    });
  }
};
