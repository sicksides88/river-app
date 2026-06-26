import { supabaseAdmin } from '../config/supabase.js';
import { mpOAuthConfig } from '../config/mercadopago.js';

/**
 * Servicio de OAuth para MercadoPago
 * Permite a los drivers conectar su cuenta de MP para recibir pagos directos
 */
export const mercadoPagoOAuthService = {
  /**
   * Genera URL de autorización para OAuth de MercadoPago
   * @param {string} driverId - ID del conductor
   * @returns {Object} URL de autorización y state
   */
  getAuthorizationUrl(driverId) {
    const state = Buffer.from(JSON.stringify({
      driverId,
      timestamp: Date.now(),
    })).toString('base64');

    const params = new URLSearchParams({
      client_id: mpOAuthConfig.clientId,
      response_type: 'code',
      platform_id: 'mp',
      redirect_uri: mpOAuthConfig.redirectUri,
      state,
    });

    const authUrl = `${mpOAuthConfig.authorizationUrl}?${params.toString()}`;

    return {
      url: authUrl,
      state,
    };
  },

  /**
   * Decodifica el state del callback
   * @param {string} state - State codificado en base64
   * @returns {Object} Datos decodificados
   */
  decodeState(state) {
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decodificando state:', error);
      return null;
    }
  },

  /**
   * Intercambia el código de autorización por tokens
   * @param {string} code - Código de autorización de MP
   * @returns {Object} Tokens de acceso
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await fetch(mpOAuthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: mpOAuthConfig.clientId,
          client_secret: mpOAuthConfig.clientSecret,
          code,
          redirect_uri: mpOAuthConfig.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al intercambiar código por tokens');
      }

      const tokenData = await response.json();

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        userId: tokenData.user_id,
        publicKey: tokenData.public_key,
      };
    } catch (error) {
      console.error('Error intercambiando código:', error);
      throw error;
    }
  },

  /**
   * Refresca el token de acceso de un driver
   * @param {string} driverId - ID del conductor
   * @returns {Object} Nuevos tokens
   */
  async refreshAccessToken(driverId) {
    try {
      // Obtener refresh_token actual
      const { data: account, error: fetchError } = await supabaseAdmin
        .from('driver_mp_accounts')
        .select('refresh_token')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .single();

      if (fetchError || !account) {
        throw new Error('Cuenta de MercadoPago no encontrada');
      }

      const response = await fetch(mpOAuthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: mpOAuthConfig.clientId,
          client_secret: mpOAuthConfig.clientSecret,
          refresh_token: account.refresh_token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Si el refresh token es inválido, marcar cuenta como expirada
        if (response.status === 400 || response.status === 401) {
          await supabaseAdmin
            .from('driver_mp_accounts')
            .update({ status: 'expired' })
            .eq('driver_id', driverId);
        }

        throw new Error(errorData.message || 'Error al refrescar token');
      }

      const tokenData = await response.json();

      // Calcular fecha de expiración
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      // Actualizar en BD
      const { error: updateError } = await supabaseAdmin
        .from('driver_mp_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          last_refresh_at: new Date().toISOString(),
        })
        .eq('driver_id', driverId);

      if (updateError) throw updateError;

      return {
        success: true,
        accessToken: tokenData.access_token,
        expiresAt,
      };
    } catch (error) {
      console.error('Error refrescando token:', error);
      throw error;
    }
  },

  /**
   * Obtiene un token de acceso válido para un driver
   * Refresca automáticamente si está próximo a expirar
   * @param {string} driverId - ID del conductor
   * @returns {Object} Token de acceso válido
   */
  async getValidAccessToken(driverId) {
    try {
      const { data: account, error } = await supabaseAdmin
        .from('driver_mp_accounts')
        .select('access_token, token_expires_at, status')
        .eq('driver_id', driverId)
        .single();

      if (error || !account) {
        return { success: false, error: 'Cuenta de MercadoPago no encontrada' };
      }

      if (account.status !== 'active') {
        return { success: false, error: 'Cuenta de MercadoPago no activa', status: account.status };
      }

      // Verificar si el token expira en los próximos 5 minutos
      const expiresAt = new Date(account.token_expires_at);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      if (expiresAt <= fiveMinutesFromNow) {
        // Necesita refresh
        const refreshResult = await this.refreshAccessToken(driverId);
        return {
          success: true,
          accessToken: refreshResult.accessToken,
          wasRefreshed: true,
        };
      }

      return {
        success: true,
        accessToken: account.access_token,
        wasRefreshed: false,
      };
    } catch (error) {
      console.error('Error obteniendo token válido:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Guarda las credenciales OAuth de un driver
   * @param {string} driverId - ID del conductor
   * @param {Object} tokenData - Datos del token
   * @returns {Object} Resultado de la operación
   */
  async saveCredentials(driverId, tokenData) {
    try {
      const {
        accessToken,
        refreshToken,
        expiresIn,
        userId,
        publicKey,
        scope,
      } = tokenData;

      // Calcular fecha de expiración
      const expiresAt = new Date(Date.now() + (expiresIn * 1000));

      // Obtener email del usuario de MP (opcional)
      let mpEmail = null;
      try {
        const userResponse = await fetch('https://api.mercadopago.com/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          mpEmail = userData.email;
        }
      } catch (e) {
        console.warn('No se pudo obtener email de MP:', e.message);
      }

      // Upsert: insertar o actualizar si ya existe
      const { data: account, error } = await supabaseAdmin
        .from('driver_mp_accounts')
        .upsert({
          driver_id: driverId,
          mp_user_id: userId.toString(),
          mp_email: mpEmail,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt.toISOString(),
          public_key: publicKey,
          scopes: scope ? scope.split(' ') : [],
          status: 'active',
          connected_at: new Date().toISOString(),
          disconnected_at: null,
        }, {
          onConflict: 'driver_id',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        account: {
          id: account.id,
          mpUserId: account.mp_user_id,
          mpEmail: account.mp_email,
          status: account.status,
          connectedAt: account.connected_at,
        },
      };
    } catch (error) {
      console.error('Error guardando credenciales:', error);
      throw error;
    }
  },

  /**
   * Desconecta la cuenta de MercadoPago de un driver
   * @param {string} driverId - ID del conductor
   * @returns {Object} Resultado de la operación
   */
  async disconnectAccount(driverId) {
    try {
      const { error } = await supabaseAdmin
        .from('driver_mp_accounts')
        .update({
          status: 'disconnected',
          access_token: '', // Limpiar tokens por seguridad
          refresh_token: '',
          disconnected_at: new Date().toISOString(),
        })
        .eq('driver_id', driverId);

      if (error) throw error;

      return {
        success: true,
        message: 'Cuenta de MercadoPago desconectada',
      };
    } catch (error) {
      console.error('Error desconectando cuenta:', error);
      throw error;
    }
  },

  /**
   * Obtiene el estado de conexión de MP de un driver
   * @param {string} driverId - ID del conductor
   * @returns {Object} Estado de la conexión
   */
  async getConnectionStatus(driverId) {
    try {
      const { data: account, error } = await supabaseAdmin
        .from('driver_mp_accounts')
        .select('id, mp_user_id, mp_email, status, connected_at, token_expires_at')
        .eq('driver_id', driverId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!account) {
        return {
          connected: false,
          status: 'not_connected',
        };
      }

      // Verificar si el token está expirado
      const isExpired = new Date(account.token_expires_at) < new Date();
      const effectiveStatus = isExpired && account.status === 'active' ? 'expired' : account.status;

      return {
        connected: effectiveStatus === 'active',
        status: effectiveStatus,
        mpUserId: account.mp_user_id,
        mpEmail: account.mp_email,
        connectedAt: account.connected_at,
        tokenExpiresAt: account.token_expires_at,
      };
    } catch (error) {
      console.error('Error obteniendo estado de conexión:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los drivers con tokens próximos a expirar
   * @param {number} minutesBefore - Minutos antes de expiración
   * @returns {Array} Lista de drivers a refrescar
   */
  async getTokensToRefresh(minutesBefore = 30) {
    try {
      const expirationThreshold = new Date(Date.now() + (minutesBefore * 60 * 1000));

      const { data: accounts, error } = await supabaseAdmin
        .from('driver_mp_accounts')
        .select('id, driver_id, refresh_token, token_expires_at')
        .eq('status', 'active')
        .lte('token_expires_at', expirationThreshold.toISOString());

      if (error) throw error;

      return accounts || [];
    } catch (error) {
      console.error('Error obteniendo tokens a refrescar:', error);
      return [];
    }
  },

  /**
   * Obtiene el mp_user_id de un driver
   * @param {string} driverId - ID del conductor
   * @returns {string|null} MP user ID o null
   */
  async getMPUserId(driverId) {
    try {
      const { data: account, error } = await supabaseAdmin
        .from('driver_mp_accounts')
        .select('mp_user_id')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .single();

      if (error || !account) return null;

      return account.mp_user_id;
    } catch (error) {
      console.error('Error obteniendo MP user ID:', error);
      return null;
    }
  },
};

export default mercadoPagoOAuthService;
