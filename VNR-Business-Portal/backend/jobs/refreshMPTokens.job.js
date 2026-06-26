import mercadoPagoOAuthService from '../services/mercadopagoOAuth.service.js';

/**
 * Job para refrescar tokens de MercadoPago que están próximos a expirar
 * Se ejecuta cada hora para mantener los tokens activos
 */

let refreshInterval = null;
let isRunning = false;

/**
 * Ejecuta el refresh de tokens
 */
const runTokenRefresh = async () => {
  if (isRunning) {
    console.log('[MP Token Refresh] Job ya en ejecución, saltando...');
    return;
  }

  isRunning = true;
  console.log('[MP Token Refresh] Iniciando refresh de tokens...');

  try {
    // Obtener tokens que expiran en los próximos 60 minutos
    const tokensToRefresh = await mercadoPagoOAuthService.getTokensToRefresh(60);

    if (tokensToRefresh.length === 0) {
      console.log('[MP Token Refresh] No hay tokens para refrescar');
      return;
    }

    console.log(`[MP Token Refresh] ${tokensToRefresh.length} tokens a refrescar`);

    let successCount = 0;
    let errorCount = 0;

    // Procesar cada token
    for (const account of tokensToRefresh) {
      try {
        await mercadoPagoOAuthService.refreshAccessToken(account.driver_id);
        successCount++;
        console.log(`[MP Token Refresh] Token refrescado para driver ${account.driver_id}`);
      } catch (error) {
        errorCount++;
        console.error(`[MP Token Refresh] Error refrescando token para driver ${account.driver_id}:`, error.message);
      }

      // Pequeña pausa entre requests para no sobrecargar la API de MP
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[MP Token Refresh] Completado - Éxitos: ${successCount}, Errores: ${errorCount}`);
  } catch (error) {
    console.error('[MP Token Refresh] Error general:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Inicia el job de refresh de tokens
 * @param {number} intervalMinutes - Intervalo en minutos (default: 60)
 */
export const startMPTokenRefreshJob = (intervalMinutes = 60) => {
  if (refreshInterval) {
    console.log('[MP Token Refresh] Job ya iniciado');
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[MP Token Refresh] Iniciando job (cada ${intervalMinutes} minutos)`);

  // Ejecutar inmediatamente al iniciar
  runTokenRefresh();

  // Configurar intervalo
  refreshInterval = setInterval(runTokenRefresh, intervalMs);
};

/**
 * Detiene el job de refresh de tokens
 */
export const stopMPTokenRefreshJob = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('[MP Token Refresh] Job detenido');
  }
};

/**
 * Ejecuta el refresh manualmente (para testing/admin)
 */
export const runManualRefresh = async () => {
  await runTokenRefresh();
};

export default {
  startMPTokenRefreshJob,
  stopMPTokenRefreshJob,
  runManualRefresh,
};
