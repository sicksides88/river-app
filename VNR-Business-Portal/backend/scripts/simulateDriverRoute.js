/**
 * Script para simular el movimiento de un conductor por una ruta
 * Uso: node scripts/simulateDriverRoute.js <deliveryId> [intervalMs]
 *
 * Ejemplo: node scripts/simulateDriverRoute.js abc123 2000
 * (mueve el conductor cada 2 segundos)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color, emoji, message) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

/**
 * Decodificar polyline de Google
 */
function decodePolyline(encoded) {
  if (!encoded) return [];

  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

/**
 * Obtener ruta de Google Directions API
 */
async function getRoute(origin, destination) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.routes[0]) {
    throw new Error(`Error obteniendo ruta: ${data.status}`);
  }

  const polyline = data.routes[0].overview_polyline.points;
  const points = decodePolyline(polyline);

  return {
    points,
    distance: data.routes[0].legs[0].distance,
    duration: data.routes[0].legs[0].duration,
  };
}

/**
 * Interpolar puntos para movimiento más suave
 */
function interpolatePoints(points, numPointsBetween = 3) {
  const result = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    result.push(start);

    for (let j = 1; j <= numPointsBetween; j++) {
      const t = j / (numPointsBetween + 1);
      result.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

/**
 * Calcular bearing entre dos puntos
 */
function calculateBearing(start, end) {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;

  const x = Math.sin(dLng) * Math.cos(endLat);
  const y = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Simular movimiento del conductor
 */
async function simulateDriverMovement(deliveryId, intervalMs = 2000) {
  log(colors.cyan, '🚗', `Iniciando simulación para delivery: ${deliveryId}`);
  log(colors.cyan, '⏱️', `Intervalo de actualización: ${intervalMs}ms`);

  // Obtener datos del delivery
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .select('*, driver:driver_id(id, nombre, apellido)')
    .eq('id', deliveryId)
    .single();

  if (error || !delivery) {
    log(colors.red, '❌', `Delivery no encontrado: ${error?.message || 'No existe'}`);
    process.exit(1);
  }

  if (!delivery.driver_id) {
    log(colors.red, '❌', 'El delivery no tiene conductor asignado. Primero acepta el envío con un conductor.');
    process.exit(1);
  }

  log(colors.green, '✅', `Delivery encontrado: ${delivery.pickup_address} → ${delivery.dropoff_address}`);
  log(colors.green, '👤', `Conductor: ${delivery.driver?.nombre} ${delivery.driver?.apellido}`);

  // Determinar origen y destino según el estado del delivery
  let origin, destination, phase;

  if (['accepted', 'confirmed', 'arrived_pickup'].includes(delivery.status)) {
    // Conductor va hacia el punto de retiro
    phase = 'TO_PICKUP';

    // Obtener ubicación actual del conductor
    const { data: driverAvail } = await supabase
      .from('driver_availability')
      .select('current_latitude, current_longitude')
      .eq('driver_id', delivery.driver_id)
      .single();

    if (driverAvail?.current_latitude) {
      origin = { lat: driverAvail.current_latitude, lng: driverAvail.current_longitude };
    } else {
      // Si no hay ubicación, simular cerca del pickup
      origin = {
        lat: delivery.pickup_lat - 0.01,
        lng: delivery.pickup_lng - 0.01
      };
    }
    destination = { lat: delivery.pickup_lat, lng: delivery.pickup_lng };
    log(colors.yellow, '📍', 'Fase: Conductor hacia punto de RETIRO');

  } else if (['picked_up', 'in_transit'].includes(delivery.status)) {
    // Conductor va hacia el punto de entrega
    phase = 'TO_DROPOFF';
    origin = { lat: delivery.pickup_lat, lng: delivery.pickup_lng };
    destination = { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng };
    log(colors.yellow, '📍', 'Fase: Conductor hacia punto de ENTREGA');

  } else {
    log(colors.red, '❌', `Estado del delivery no válido para simulación: ${delivery.status}`);
    log(colors.yellow, '💡', 'Estados válidos: confirmed, accepted, arrived_pickup, picked_up, in_transit');
    process.exit(1);
  }

  // Obtener ruta
  log(colors.blue, '🗺️', 'Obteniendo ruta de Google Maps...');
  const route = await getRoute(origin, destination);
  log(colors.green, '✅', `Ruta obtenida: ${route.points.length} puntos, ${route.distance.text}, ${route.duration.text}`);

  // Interpolar para movimiento más suave
  const smoothPoints = interpolatePoints(route.points, 2);
  log(colors.blue, '📊', `Puntos interpolados: ${smoothPoints.length}`);

  // Simular movimiento usando el endpoint HTTP
  log(colors.cyan, '🚀', 'Iniciando simulación de movimiento...');
  log(colors.cyan, '📡', `Usando endpoint: ${API_URL}/deliveries/simulate/location`);
  log(colors.cyan, '⏹️', 'Presiona Ctrl+C para detener\n');

  let currentIndex = 0;

  const moveDriver = async () => {
    if (currentIndex >= smoothPoints.length) {
      log(colors.green, '🎉', 'Simulación completada - Conductor llegó al destino');

      // Actualizar estado si llegó
      if (phase === 'TO_PICKUP') {
        await supabase
          .from('deliveries')
          .update({ status: 'arrived_pickup' })
          .eq('id', deliveryId);
        log(colors.green, '📦', 'Estado actualizado: arrived_pickup');
      } else if (phase === 'TO_DROPOFF') {
        await supabase
          .from('deliveries')
          .update({ status: 'arrived_dropoff' })
          .eq('id', deliveryId);
        log(colors.green, '📦', 'Estado actualizado: arrived_dropoff');
      }

      process.exit(0);
    }

    const point = smoothPoints[currentIndex];
    const nextPoint = smoothPoints[currentIndex + 1] || point;
    const bearing = calculateBearing(point, nextPoint);
    const progress = ((currentIndex / smoothPoints.length) * 100).toFixed(1);
    const speed = 30 + Math.random() * 20; // 30-50 km/h simulado

    try {
      // Llamar al endpoint de simulación
      const response = await fetch(`${API_URL}/deliveries/simulate/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryId,
          latitude: point.latitude,
          longitude: point.longitude,
          heading: bearing,
          speed,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        log(colors.yellow, '⚠️', `Error: ${result.message}`);
      }

      log(colors.blue, '📍', `[${progress}%] Lat: ${point.latitude.toFixed(6)}, Lng: ${point.longitude.toFixed(6)}, Bearing: ${bearing.toFixed(0)}°`);
    } catch (err) {
      log(colors.red, '❌', `Error HTTP: ${err.message}`);
    }

    currentIndex++;
  };

  // Ejecutar primera actualización inmediatamente
  await moveDriver();

  // Continuar con intervalo
  const interval = setInterval(moveDriver, intervalMs);

  // Manejar salida
  process.on('SIGINT', () => {
    log(colors.yellow, '\n⏹️', 'Simulación detenida por el usuario');
    clearInterval(interval);
    process.exit(0);
  });
}

// Ejecutar
const deliveryId = process.argv[2];
const intervalMs = parseInt(process.argv[3]) || 2000;

if (!deliveryId) {
  console.log(`
${colors.cyan}🚗 Simulador de Movimiento de Conductor${colors.reset}

${colors.yellow}Uso:${colors.reset}
  node scripts/simulateDriverRoute.js <deliveryId> [intervalMs]

${colors.yellow}Parámetros:${colors.reset}
  deliveryId  - ID del delivery a simular (requerido)
  intervalMs  - Intervalo entre actualizaciones en ms (default: 2000)

${colors.yellow}Ejemplo:${colors.reset}
  node scripts/simulateDriverRoute.js abc-123-def 1500

${colors.yellow}Notas:${colors.reset}
  - El delivery debe tener un conductor asignado
  - Estados válidos: accepted, arrived_pickup, picked_up, in_transit
  - La simulación actualiza la ubicación en DB y emite por WebSocket
  `);
  process.exit(1);
}

simulateDriverMovement(deliveryId, intervalMs).catch((err) => {
  log(colors.red, '❌', `Error: ${err.message}`);
  process.exit(1);
});
