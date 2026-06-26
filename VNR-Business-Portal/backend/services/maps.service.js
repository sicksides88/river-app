/**
 * Google Maps Service
 * Backend proxy for Google Maps APIs (Places, Directions, Geocoding)
 * Keeps API key secure on server-side
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api';

// Session tokens for Places API cost optimization
const sessionTokens = new Map();

/**
 * Generate a unique session token for Places API
 */
const generateSessionToken = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create session token for a user
 */
const getSessionToken = (userId) => {
  if (!sessionTokens.has(userId)) {
    sessionTokens.set(userId, {
      token: generateSessionToken(),
      createdAt: Date.now(),
    });
  }

  const session = sessionTokens.get(userId);

  // Expire tokens after 3 minutes (Google's recommendation)
  if (Date.now() - session.createdAt > 180000) {
    session.token = generateSessionToken();
    session.createdAt = Date.now();
  }

  return session.token;
};

/**
 * Clear session token after place selection (to start new billing session)
 */
const clearSessionToken = (userId) => {
  sessionTokens.delete(userId);
};

const mapsService = {
  // ==========================================
  // PLACES API
  // ==========================================

  /**
   * Search places with autocomplete
   * @param {string} input - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Predictions
   */
  async searchPlaces(input, options = {}) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const {
      userId,
      location,
      radius = 50000, // 50km radius for local results
      language = 'es',
      components = 'country:ar|country:uy', // Argentina + Uruguay
      types = '', // Empty = all types (addresses, establishments, etc.) for better results
    } = options;

    const sessionToken = userId ? getSessionToken(userId) : generateSessionToken();

    let url = `${BASE_URL}/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&language=${language}&sessiontoken=${sessionToken}`;

    if (components) {
      url += `&components=${components}`;
    }

    // Use location bias - prioritizes nearby results but doesn't exclude others
    if (location) {
      url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
    }

    if (types) {
      url += `&types=${types}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      const err = new Error(data.error_message || `Places API error: ${data.status}`);
      err.statusCode = data.status === 'REQUEST_DENIED' ? 403 : 502;
      throw err;
    }

    return (data.predictions || []).map((place) => ({
      placeId: place.place_id,
      description: place.description,
      mainText: place.structured_formatting?.main_text,
      secondaryText: place.structured_formatting?.secondary_text,
      types: place.types,
    }));
  },

  /**
   * Get place details by place_id
   * @param {string} placeId - Google place ID
   * @param {string} userId - User ID for session token
   * @returns {Promise<object>} Place details
   */
  async getPlaceDetails(placeId, userId = null) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const sessionToken = userId ? getSessionToken(userId) : '';

    const fields = 'geometry,formatted_address,name,place_id,address_components,types';
    let url = `${BASE_URL}/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=${fields}&language=es`;

    if (sessionToken) {
      url += `&sessiontoken=${sessionToken}`;
      // Clear session after place selection (billing session complete)
      clearSessionToken(userId);
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Place Details API error:', data.status, data.error_message);
      const err = new Error(data.error_message || `Place Details API error: ${data.status}`);
      err.statusCode = data.status === 'REQUEST_DENIED' ? 403 : 502;
      throw err;
    }

    const result = data.result;

    // Extraer componentes para construir dirección precisa
    const components = {};
    (result.address_components || []).forEach((component) => {
      const type = component.types[0];
      components[type] = component.long_name;
      components[`${type}_short`] = component.short_name;
    });

    // Construir dirección precisa con número de calle
    const preciseAddress = buildPreciseAddress(components, result.formatted_address);

    return {
      placeId: result.place_id,
      name: result.name,
      address: preciseAddress,
      formattedAddress: result.formatted_address,
      coordinates: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      addressComponents: result.address_components,
      components: {
        streetNumber: components.street_number,
        street: components.route,
        neighborhood: components.sublocality_level_1 || components.neighborhood,
        city: components.locality || components.administrative_area_level_2,
        state: components.administrative_area_level_1,
        country: components.country,
        postalCode: components.postal_code,
      },
      types: result.types,
    };
  },

  // ==========================================
  // DIRECTIONS API
  // ==========================================

  /**
   * Get route between two points
   * @param {object} origin - Origin coordinates { latitude, longitude }
   * @param {object} destination - Destination coordinates { latitude, longitude }
   * @param {object} options - Route options
   * @returns {Promise<object>} Route data
   */
  async getDirections(origin, destination, options = {}) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const {
      mode = 'driving',
      alternatives = false,
      waypoints = [],
      avoidTolls = false,
      avoidHighways = false,
      departureTime,
      language = 'es',
    } = options;

    let url = `${BASE_URL}/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=${mode}&language=${language}`;

    if (alternatives) {
      url += '&alternatives=true';
    }

    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .map((wp) => `${wp.latitude},${wp.longitude}`)
        .join('|');
      url += `&waypoints=optimize:true|${waypointsStr}`;
    }

    const avoid = [];
    if (avoidTolls) avoid.push('tolls');
    if (avoidHighways) avoid.push('highways');
    if (avoid.length > 0) {
      url += `&avoid=${avoid.join('|')}`;
    }

    if (departureTime) {
      url += `&departure_time=${departureTime}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Directions API error:', data.status, data.error_message);
      const err = new Error(data.error_message || `Directions API error: ${data.status}`);
      err.statusCode = data.status === 'REQUEST_DENIED' ? 403 : 502;
      throw err;
    }

    const routes = data.routes.map((route) => ({
      summary: route.summary,
      polyline: route.overview_polyline.points,
      bounds: route.bounds,
      legs: route.legs.map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
        durationInTraffic: leg.duration_in_traffic,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        startLocation: leg.start_location,
        endLocation: leg.end_location,
        steps: leg.steps.map((step) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: step.html_instructions?.replace(/<[^>]*>/g, ''),
          maneuver: step.maneuver,
          polyline: step.polyline.points,
          startLocation: step.start_location,
          endLocation: step.end_location,
        })),
      })),
      warnings: route.warnings,
      waypointOrder: route.waypoint_order,
    }));

    // Calculate totals for the primary route
    const primaryRoute = routes[0];
    const totalDistance = primaryRoute.legs.reduce(
      (sum, leg) => sum + leg.distance.value,
      0
    );
    const totalDuration = primaryRoute.legs.reduce(
      (sum, leg) => sum + leg.duration.value,
      0
    );

    return {
      routes,
      primaryRoute: {
        ...primaryRoute,
        totalDistance: {
          value: totalDistance,
          text: `${(totalDistance / 1000).toFixed(1)} km`,
        },
        totalDuration: {
          value: totalDuration,
          text: formatDuration(totalDuration),
        },
      },
    };
  },

  /**
   * Get distance matrix for multiple origins/destinations
   * @param {Array} origins - Array of origin coordinates
   * @param {Array} destinations - Array of destination coordinates
   * @param {object} options - Options
   * @returns {Promise<object>} Distance matrix
   */
  async getDistanceMatrix(origins, destinations, options = {}) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const { mode = 'driving', language = 'es' } = options;

    const originsStr = origins
      .map((o) => `${o.latitude},${o.longitude}`)
      .join('|');
    const destinationsStr = destinations
      .map((d) => `${d.latitude},${d.longitude}`)
      .join('|');

    const url = `${BASE_URL}/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${GOOGLE_MAPS_API_KEY}&mode=${mode}&language=${language}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Distance Matrix API error:', data.status, data.error_message);
      const err = new Error(data.error_message || `Distance Matrix API error: ${data.status}`);
      err.statusCode = data.status === 'REQUEST_DENIED' ? 403 : 502;
      throw err;
    }

    return {
      originAddresses: data.origin_addresses,
      destinationAddresses: data.destination_addresses,
      rows: data.rows.map((row) => ({
        elements: row.elements.map((el) => ({
          status: el.status,
          distance: el.distance,
          duration: el.duration,
          durationInTraffic: el.duration_in_traffic,
        })),
      })),
    };
  },

  // ==========================================
  // GEOCODING API
  // ==========================================

  /**
   * Get coordinates from address (geocoding)
   * @param {string} address - Address to geocode
   * @returns {Promise<object>} Coordinates and formatted address
   */
  async geocode(address) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `${BASE_URL}/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=es&region=ar`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Geocoding API error:', data.status, data.error_message);
      const err = new Error(data.error_message || `Geocoding API error: ${data.status}`);
      err.statusCode = data.status === 'REQUEST_DENIED' ? 403 : 502;
      throw err;
    }

    if (data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    return {
      coordinates: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents: result.address_components,
      types: result.types,
    };
  },

  /**
   * Get address from coordinates (reverse geocoding)
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<object>} Address details
   */
  async reverseGeocode(latitude, longitude) {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `${BASE_URL}/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=es`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Reverse Geocoding API error:', data.status, data.error_message);
      const err = new Error(data.error_message || `Reverse Geocoding API error: ${data.status}`);
      err.statusCode = data.status === 'REQUEST_DENIED' ? 403 : 502;
      throw err;
    }

    if (data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const components = {};

    result.address_components.forEach((component) => {
      const type = component.types[0];
      components[type] = component.long_name;
      components[`${type}_short`] = component.short_name;
    });

    // Construir dirección precisa
    const preciseAddress = buildPreciseAddress(components, result.formatted_address);

    return {
      formattedAddress: preciseAddress,
      originalFormattedAddress: result.formatted_address,
      placeId: result.place_id,
      coordinates: {
        latitude,
        longitude,
      },
      components: {
        streetNumber: components.street_number,
        street: components.route,
        neighborhood: components.sublocality_level_1 || components.neighborhood,
        city: components.locality || components.administrative_area_level_2,
        state: components.administrative_area_level_1,
        country: components.country,
        postalCode: components.postal_code,
      },
    };
  },

  // ==========================================
  // ETA CALCULATIONS
  // ==========================================

  /**
   * Calculate ETA between two points
   * @param {object} origin - Origin coordinates
   * @param {object} destination - Destination coordinates
   * @returns {Promise<object>} ETA data
   */
  async calculateETA(origin, destination) {
    const directions = await this.getDirections(origin, destination, {
      departureTime: 'now',
    });

    const primaryLeg = directions.primaryRoute.legs[0];

    return {
      distance: primaryLeg.distance,
      duration: primaryLeg.duration,
      durationInTraffic: primaryLeg.durationInTraffic || primaryLeg.duration,
      arrivalTime: new Date(
        Date.now() + (primaryLeg.durationInTraffic?.value || primaryLeg.duration.value) * 1000
      ),
    };
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Build a precise address from components
 * Prioritizes street + number format for Argentina
 */
function buildPreciseAddress(components, fallbackAddress) {
  const parts = [];

  // Calle y número (ej: "Av. Corrientes 1234")
  if (components.route) {
    if (components.street_number) {
      parts.push(`${components.route} ${components.street_number}`);
    } else {
      parts.push(components.route);
    }
  }

  // Barrio/Localidad
  const neighborhood = components.sublocality_level_1 || components.neighborhood;
  if (neighborhood && !parts.some(p => p.includes(neighborhood))) {
    parts.push(neighborhood);
  }

  // Ciudad
  const city = components.locality || components.administrative_area_level_2;
  if (city && !parts.some(p => p.includes(city))) {
    parts.push(city);
  }

  // Provincia (abreviada)
  if (components.administrative_area_level_1_short) {
    parts.push(components.administrative_area_level_1_short);
  }

  // Si no pudimos construir una dirección precisa, usar el fallback
  if (parts.length === 0) {
    return fallbackAddress;
  }

  return parts.join(', ');
}

/**
 * Format duration in seconds to human readable string
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} seg`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }

  return `${minutes} min`;
}

export default mapsService;
