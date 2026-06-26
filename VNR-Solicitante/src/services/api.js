import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';
import { supabase } from './supabase';

// Log solo en desarrollo
if (__DEV__) {
  console.log('🔌 API URL:', CONFIG.API_URL);
}

const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Renueva el access token usando el refresh token guardado.
let isRefreshing = false;
let refreshPromise = null;

async function getFreshToken() {
  const refresh_token = await AsyncStorage.getItem('refreshToken');
  if (!refresh_token) return null;
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data?.session?.access_token) return null;
    await AsyncStorage.setItem('token', data.session.access_token);
    if (data.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', data.session.refresh_token);
    }
    return data.session.access_token;
  } catch (e) {
    return null;
  }
}

// Interceptor de respuesta: si expira el token (401), lo renueva y reintenta una vez.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = getFreshToken().finally(() => { isRefreshing = false; });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // No borrar sesión acá: AuthContext decide si cerrar sesión
    }
    return Promise.reject(error);
  }
);

export default api;
