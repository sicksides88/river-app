/**
 * Servicio de navegación GPS para conductores
 * Integra deep links con Google Maps, Waze y Apple Maps
 */

import { Linking, Platform } from 'react-native';

// Esquemas de URLs para cada app de navegación
const NAV_APPS = {
  googleMaps: {
    name: 'Google Maps',
    icon: 'map',
    // Android: intent o web fallback, iOS: URL scheme
    getUrl: (dest, origin) => {
      const destParam = `${dest.latitude},${dest.longitude}`;
      const originParam = origin ? `${origin.latitude},${origin.longitude}` : '';

      if (Platform.OS === 'ios') {
        // iOS: usar comgooglemaps si está instalado, sino web
        return origin
          ? `comgooglemaps://?saddr=${originParam}&daddr=${destParam}&directionsmode=driving`
          : `comgooglemaps://?daddr=${destParam}&directionsmode=driving`;
      }

      // Android: usar intent de Google Maps
      return origin
        ? `google.navigation:q=${destParam}&origin=${originParam}`
        : `google.navigation:q=${destParam}`;
    },
    // URL web como fallback
    getWebUrl: (dest, origin) => {
      const destParam = `${dest.latitude},${dest.longitude}`;
      const originParam = origin ? `${origin.latitude},${origin.longitude}` : '';

      return origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;
    },
    checkScheme: Platform.OS === 'ios' ? 'comgooglemaps://' : 'google.navigation:',
  },

  waze: {
    name: 'Waze',
    icon: 'navigation',
    getUrl: (dest) => {
      return `waze://?ll=${dest.latitude},${dest.longitude}&navigate=yes`;
    },
    getWebUrl: (dest) => {
      return `https://waze.com/ul?ll=${dest.latitude},${dest.longitude}&navigate=yes`;
    },
    checkScheme: 'waze://',
  },

  appleMaps: {
    name: 'Apple Maps',
    icon: 'map-pin',
    // Solo disponible en iOS
    getUrl: (dest, origin, address) => {
      const destParam = `${dest.latitude},${dest.longitude}`;
      const originParam = origin ? `${origin.latitude},${origin.longitude}` : '';

      let url = `maps://?daddr=${destParam}`;
      if (origin) {
        url += `&saddr=${originParam}`;
      }
      if (address) {
        url += `&q=${encodeURIComponent(address)}`;
      }
      return url;
    },
    getWebUrl: (dest) => {
      return `https://maps.apple.com/?daddr=${dest.latitude},${dest.longitude}`;
    },
    checkScheme: 'maps://',
    platformOnly: 'ios',
  },
};

/**
 * Verifica si una app de navegación está instalada
 * @param {string} appKey - Clave de la app (googleMaps, waze, appleMaps)
 * @returns {Promise<boolean>}
 */
const canOpenApp = async (appKey) => {
  const app = NAV_APPS[appKey];
  if (!app) return false;

  // Verificar si es exclusiva de una plataforma
  if (app.platformOnly && Platform.OS !== app.platformOnly) {
    return false;
  }

  try {
    return await Linking.canOpenURL(app.checkScheme);
  } catch (error) {
    console.warn(`Error checking ${app.name}:`, error);
    return false;
  }
};

/**
 * Obtiene las apps de navegación disponibles en el dispositivo
 * @returns {Promise<Array>}
 */
const getAvailableApps = async () => {
  const available = [];

  for (const [key, app] of Object.entries(NAV_APPS)) {
    // Saltar si es exclusiva de otra plataforma
    if (app.platformOnly && Platform.OS !== app.platformOnly) {
      continue;
    }

    const canOpen = await canOpenApp(key);
    if (canOpen) {
      available.push({
        key,
        name: app.name,
        icon: app.icon,
      });
    }
  }

  // Siempre agregar Google Maps web como fallback
  if (available.length === 0) {
    available.push({
      key: 'googleMapsWeb',
      name: 'Google Maps (Web)',
      icon: 'map',
      isWeb: true,
    });
  }

  return available;
};

/**
 * Abre una app de navegación con el destino especificado
 * @param {string} appKey - Clave de la app
 * @param {Object} destination - {latitude, longitude}
 * @param {Object} origin - {latitude, longitude} (opcional)
 * @param {string} address - Dirección del destino (opcional)
 * @returns {Promise<boolean>}
 */
const openNavigationApp = async (appKey, destination, origin = null, address = null) => {
  // Validar destino
  if (!destination || !destination.latitude || !destination.longitude) {
    console.error('Destino inválido para navegación');
    return false;
  }

  // Manejar fallback web
  if (appKey === 'googleMapsWeb') {
    const webUrl = NAV_APPS.googleMaps.getWebUrl(destination, origin);
    return await Linking.openURL(webUrl);
  }

  const app = NAV_APPS[appKey];
  if (!app) {
    console.error(`App de navegación no encontrada: ${appKey}`);
    return false;
  }

  try {
    const canOpen = await canOpenApp(appKey);

    if (canOpen) {
      const url = app.getUrl(destination, origin, address);
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback a versión web
      if (app.getWebUrl) {
        const webUrl = app.getWebUrl(destination, origin);
        await Linking.openURL(webUrl);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error(`Error abriendo ${app.name}:`, error);

    // Intentar fallback web
    if (app.getWebUrl) {
      try {
        const webUrl = app.getWebUrl(destination, origin);
        await Linking.openURL(webUrl);
        return true;
      } catch (webError) {
        console.error('Error abriendo versión web:', webError);
      }
    }

    return false;
  }
};

/**
 * Abre Google Maps con el destino
 * @param {Object} destination - {latitude, longitude}
 * @param {Object} origin - {latitude, longitude} (opcional)
 * @returns {Promise<boolean>}
 */
const openGoogleMaps = async (destination, origin = null) => {
  return await openNavigationApp('googleMaps', destination, origin);
};

/**
 * Abre Waze con el destino
 * @param {Object} destination - {latitude, longitude}
 * @returns {Promise<boolean>}
 */
const openWaze = async (destination) => {
  return await openNavigationApp('waze', destination);
};

/**
 * Abre Apple Maps con el destino (solo iOS)
 * @param {Object} destination - {latitude, longitude}
 * @param {Object} origin - {latitude, longitude} (opcional)
 * @param {string} address - Dirección del destino (opcional)
 * @returns {Promise<boolean>}
 */
const openAppleMaps = async (destination, origin = null, address = null) => {
  if (Platform.OS !== 'ios') {
    console.warn('Apple Maps solo está disponible en iOS');
    return false;
  }
  return await openNavigationApp('appleMaps', destination, origin, address);
};

/**
 * Abre la app de navegación preferida o muestra selector
 * @param {string} preferredApp - App preferida del usuario
 * @param {Object} destination - {latitude, longitude}
 * @param {Object} origin - {latitude, longitude} (opcional)
 * @returns {Promise<boolean>}
 */
const openPreferredNavigation = async (preferredApp, destination, origin = null) => {
  if (preferredApp && await canOpenApp(preferredApp)) {
    return await openNavigationApp(preferredApp, destination, origin);
  }

  // Si no hay app preferida o no está disponible, usar Google Maps
  return await openGoogleMaps(destination, origin);
};

/**
 * Formatea coordenadas para mostrar
 * @param {Object} coords - {latitude, longitude}
 * @returns {string}
 */
const formatCoordinates = (coords) => {
  if (!coords) return '';
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
};

export const navigationService = {
  // Funciones principales
  getAvailableApps,
  openNavigationApp,
  openGoogleMaps,
  openWaze,
  openAppleMaps,
  openPreferredNavigation,

  // Utilidades
  canOpenApp,
  formatCoordinates,

  // Constantes
  NAV_APPS,
};

export default navigationService;
