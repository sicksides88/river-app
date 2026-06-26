import { supabaseAdmin } from "../config/supabase.js";
import priceRulesService from "./priceRules.service.js";

// ============================================
// Servicio de precios - FUENTE DE VERDAD
// ============================================
// Calcula el precio de un servicio leyendo las tarifas configuradas en el CRM
// (tabla service_rates). El backend usa esto para NO confiar en el precio que
// manda el cliente. Mantiene sincronizados CRM <-> apps <-> cobro real.

// Normaliza los distintos nombres de service_type que usan las apps al
// service_type canónico de service_rates: vuelta_segura | envios | fletes | chofer
const SERVICE_TYPE_MAP = {
  vuelta_segura: 'vuelta_segura',
  'vuelta-segura': 'vuelta_segura',
  envio: 'envios',
  envios: 'envios',
  envio_express: 'envios',
  cadete: 'envios',
  flete: 'fletes',
  fletes: 'fletes',
  chofer: 'chofer',
};

// Defaults de respaldo si no hay tarifa configurada (no debería pasar).
// included_km = distancia incluida en la base (ej. envíos: ~1km / 10 cuadras).
const DEFAULT_RATES = {
  envios: { base_rate: 1000, per_unit_rate: 650, minimum_price: 1500, unit_type: 'km', included_km: 1 },
  vuelta_segura: { base_rate: 2000, per_unit_rate: 1000, minimum_price: 4000, unit_type: 'km', included_km: 0 },
  fletes: { base_rate: 5000, per_unit_rate: 1000, minimum_price: 10000, unit_type: 'km', included_km: 0 },
  chofer: { base_rate: 3000, per_unit_rate: 2500, minimum_price: 5000, unit_type: 'hora', included_km: 0 },
};

export function normalizeServiceType(serviceType) {
  return SERVICE_TYPE_MAP[serviceType] || serviceType;
}

export async function getServiceRate(serviceType) {
  const canonical = normalizeServiceType(serviceType);
  try {
    const { data } = await supabaseAdmin
      .from('service_rates')
      .select('*')
      .eq('service_type', canonical)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      // included_km puede no existir aún como columna en service_rates: en ese
      // caso usamos el default del código (envíos: ~1km). Si el CRM agrega la
      // columna, su valor manda. Mantiene la feature configurable sin bloquear.
      const def = DEFAULT_RATES[canonical] || {};
      return {
        ...data,
        included_km: data.included_km ?? def.included_km ?? 0,
        service_type: canonical,
      };
    }
  } catch (e) {
    console.error('pricing.getServiceRate error:', e?.message);
  }
  const fallback = DEFAULT_RATES[canonical] || DEFAULT_RATES.envios;
  return { ...fallback, service_type: canonical };
}

/**
 * Calcula el precio estimado de un servicio según las tarifas del CRM.
 * @param {Object} p
 * @param {string} p.serviceType - tipo de servicio (cualquier alias)
 * @param {number} [p.distanceKm=0] - distancia en km (servicios por km)
 * @param {number} [p.hours=0] - horas (servicios por hora, ej. chofer)
 * @param {Date} [p.when=new Date()] - instante del servicio (para recargos horarios)
 * @returns {Promise<{price:number, rate:object, units:number, billableUnits:number, includedUnits:number, surchargePct:number, surcharges:Array}>}
 */
export async function estimatePrice({ serviceType, distanceKm = 0, hours = 0, when = new Date() }) {
  const rate = await getServiceRate(serviceType);
  const isHourly = rate.unit_type === 'hora';
  const units = isHourly ? Number(hours) || 0 : Number(distanceKm) || 0;

  // Distancia incluida en la base (ej. envíos incluyen ~1km / 10 cuadras).
  // Solo aplica a servicios por km; los servicios por hora no descuentan.
  const includedUnits = isHourly ? 0 : Number(rate.included_km) || 0;
  const billableUnits = Math.max(0, units - includedUnits);

  let price = Number(rate.base_rate) + billableUnits * Number(rate.per_unit_rate);
  price = Math.max(price, Number(rate.minimum_price));

  // Recargos activos (ej. nocturno) configurados en el CRM (price_rules).
  const surcharges = await priceRulesService.getActiveSurcharges(rate.service_type, when);
  const surchargePct = surcharges.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
  if (surchargePct > 0) {
    price = price * (1 + surchargePct / 100);
  }

  // Redondear a múltiplo de 50 (consistente con envíos de comercio)
  price = Math.ceil(price / 50) * 50;
  return { price, rate, units, billableUnits, includedUnits, surchargePct, surcharges };
}

/**
 * Devuelve los servicios habilitados (service_rates.is_active = true).
 * Es lo que el admin activa/desactiva desde el CRM. Las apps lo usan para
 * mostrar solo los servicios que la plataforma tiene habilitados.
 * @returns {Promise<Array<{service_type, base_rate, per_unit_rate, minimum_price, unit_type}>>}
 */
export async function getEnabledServices() {
  try {
    const { data } = await supabaseAdmin
      .from('service_rates')
      .select('service_type, base_rate, per_unit_rate, minimum_price, unit_type')
      .eq('is_active', true)
      .order('service_type', { ascending: true });
    return data || [];
  } catch (e) {
    console.error('pricing.getEnabledServices error:', e?.message);
    return [];
  }
}

export default { estimatePrice, getServiceRate, normalizeServiceType, getEnabledServices };
