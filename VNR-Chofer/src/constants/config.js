import { API_URL, GOOGLE_MAPS_API_KEY } from '@env';

export const CONFIG = {
  API_URL: API_URL || 'https://vnr-api.whapy.com/api',
  GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY || 'AIzaSyDVx2koEMBRSqFRRFn_YvDPcgEU53gPsbM',

  // Timeouts
  API_TIMEOUT: 30000,
  LOCATION_TIMEOUT: 15000,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,

  // Location
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds

  // App info
  APP_NAME: 'River Service Patrón',
  APP_VERSION: '1.0.0',

  /** 'river' = solo patrón náutico (UI Figma). 'legacy' = movilidad terrestre VNR. */
  APP_MODE: 'river',

  /**
   * EN GUARDIA — validación de turno RS (patrol_shifts).
   * MVP / dev: false → solo importa la disponibilidad horaria (Agenda).
   * Producción: cambiar a true → exigir turno activo asignado por River Service además de la ventana de disponibilidad.
   */
  REQUIRE_PATROL_SHIFT_FOR_GUARD: false,

  /**
   * EN GUARDIA — validación de ventana horaria (Agenda).
   * MVP / dev: false → basta con tener disponibilidad configurada (no exige estar “dentro del horario” ahora).
   * Producción: true → solo EN GUARDIA dentro de weekly_schedule / fechas extra.
   */
  REQUIRE_GUARD_AVAILABILITY_WINDOW: false,
};

export const isRiverMode = () => CONFIG.APP_MODE === 'river';

export default CONFIG;
