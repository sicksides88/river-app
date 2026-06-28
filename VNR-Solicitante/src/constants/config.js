import { API_URL, GOOGLE_MAPS_API_KEY } from '@env';

export const CONFIG = {
  API_URL: API_URL || 'https://river-backend-idio.onrender.com/api',
  GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY || 'AIzaSyDVx2koEMBRSqFRRFn_YvDPcgEU53gPsbM',

  // Timeouts
  API_TIMEOUT: 30000,
  LOCATION_TIMEOUT: 15000,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,

  // Location
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds

  // App info
  APP_NAME: 'River Service',
  APP_VERSION: '1.0.0',
};

export default CONFIG;
