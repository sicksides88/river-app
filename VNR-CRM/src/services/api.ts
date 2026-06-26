import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - agrega token de autenticación
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refrescar sesión antes de destruirla
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !session) {
        // Sesión realmente expirada, cerrar sesión limpiamente
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
      // Si el refresh funcionó, el usuario puede reintentar manualmente
    }
    return Promise.reject(error);
  }
);

export default api;
