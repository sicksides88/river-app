import { supabaseAdmin } from "../config/supabase.js";

// Hora local de Argentina en formato "HH:MM" (24h) para un instante dado.
function argentinaHHMM(when) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(when);
  } catch {
    // Fallback: UTC-3 fijo
    const d = new Date(when.getTime() - 3 * 3600 * 1000);
    return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  }
}

// Día de la semana (0=domingo..6=sábado) en hora de Argentina.
function argentinaDOW(when) {
  try {
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short',
    }).format(when);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
  } catch {
    const d = new Date(when.getTime() - 3 * 3600 * 1000);
    return d.getUTCDay();
  }
}

// Evalúa el JSONB `conditions` de una regla contra el instante `when`.
// Soporta ventana horaria (start_time/end_time, puede cruzar medianoche) y
// días de la semana opcionales. Sin condiciones => la regla aplica siempre.
function matchesConditions(conditions, when) {
  if (!conditions || typeof conditions !== 'object') return true;

  // Ventana horaria. Acepta las claves reales (start_time/end_time) y los
  // alias que aparecen en algunos seeds (time_start/time_end).
  const startTime = conditions.start_time || conditions.time_start;
  const endTime = conditions.end_time || conditions.time_end;
  if (startTime && endTime) {
    const cur = argentinaHHMM(when);
    const inWindow = startTime <= endTime
      ? (cur >= startTime && cur < endTime)
      : (cur >= startTime || cur < endTime); // ventana que cruza medianoche
    if (!inWindow) return false;
  }

  // Días de la semana (opcional): array de números 0-6 o nombres ("mon"...).
  const dowList = conditions.days_of_week || conditions.days;
  if (Array.isArray(dowList) && dowList.length > 0) {
    const dow = argentinaDOW(when);
    const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const ok = dowList.some(d =>
      d === dow || (typeof d === 'string' && names[dow] === d.toLowerCase().slice(0, 3))
    );
    if (!ok) return false;
  }

  return true;
}

const priceRulesService = {
  /**
   * Devuelve los recargos (rule_type='surcharge') activos que aplican a un
   * servicio en un instante dado. Ej: recargo nocturno. Las reglas y sus
   * ventanas/porcentajes se configuran desde el CRM (tabla price_rules).
   *
   * @param {string} serviceType - tipo de servicio canónico (envios, fletes, ...)
   * @param {Date} [when=new Date()] - instante a evaluar (default: ahora)
   * @returns {Promise<Array<{percentage:number, name:string}>>}
   */
  async getActiveSurcharges(serviceType, when = new Date()) {
    try {
      const { data: rules, error } = await supabaseAdmin
        .from('price_rules')
        .select('*')
        .eq('rule_type', 'surcharge')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error || !rules || rules.length === 0) return [];

      return rules.filter(r => {
        const appliesToService = !r.applies_to || r.applies_to.length === 0 || r.applies_to.includes(serviceType);
        if (!appliesToService) return false;
        if ((Number(r.percentage) || 0) <= 0) return false;
        return matchesConditions(r.conditions, when);
      });
    } catch (err) {
      console.error('Error getting surcharges:', err);
      return [];
    }
  },

  /**
   * Obtiene el descuento por pago en efectivo para un tipo de servicio y precio dado.
   * Busca en la tabla price_rules una regla activa de tipo 'cash_discount'
   * que aplique al servicio indicado.
   *
   * @param {string} serviceType - Tipo de servicio (vuelta_segura, chofer, envios, fletes)
   * @param {number} originalPrice - Precio original antes del descuento
   * @returns {Object|null} { percentage, discountAmount, finalPrice } o null si no hay descuento
   */
  async getCashDiscount(serviceType, originalPrice) {
    try {
      const { data: rules, error } = await supabaseAdmin
        .from('price_rules')
        .select('*')
        .eq('rule_type', 'cash_discount')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error || !rules || rules.length === 0) return null;

      // Buscar una regla que aplique a este tipo de servicio
      const rule = rules.find(r => {
        if (!r.applies_to || r.applies_to.length === 0) return true; // aplica a todos
        return r.applies_to.includes(serviceType);
      });

      if (!rule) return null;

      const percentage = rule.percentage || 0;
      if (percentage <= 0) return null;

      const discountAmount = Math.round(originalPrice * (percentage / 100));
      const finalPrice = originalPrice - discountAmount;

      return {
        percentage,
        discountAmount,
        finalPrice: Math.max(finalPrice, 0),
      };
    } catch (err) {
      console.error('Error getting cash discount:', err);
      return null;
    }
  },
};

export default priceRulesService;
