import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const authService = {
  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      // Sincronizar sesión con Supabase para operaciones de Storage
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        await supabase.auth.setSession({
          access_token: response.data.token,
          refresh_token: response.data.refreshToken,
        });
      }
    }
    return response.data;
  },

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

      // Sincronizar sesión con Supabase para operaciones de Storage
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        await supabase.auth.setSession({
          access_token: response.data.token,
          refresh_token: response.data.refreshToken,
        });
      }
    }
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continuar con logout local aunque falle el servidor
      console.error('Logout server error:', error);
    } finally {
      // Limpiar sesión de Supabase
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
    }
  },

  /**
   * Limpiar sesión local sin llamar al servidor
   */
  async clearLocal() {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
  },

  /**
   * Obtener datos del usuario actual
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  /**
   * Solicitar código de recuperación de contraseña
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Resetear contraseña con código OTP
   */
  async resetPassword(email, otp, newPassword) {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  /**
   * Obtener usuario almacenado localmente
   */
  async getStoredUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Obtener token almacenado
   */
  async getStoredToken() {
    return await AsyncStorage.getItem('token');
  },

  /**
   * Restaurar sesión de Supabase desde tokens guardados (sobrevive reloads de Expo)
   */
  async restoreSession() {
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (token && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });
      if (!error) return true;
    }
    return this.tryRefreshToken();
  },

  /**
   * Renovar access token con refresh token
   */
  async tryRefreshToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data?.session?.access_token) return false;
      await AsyncStorage.setItem('token', data.session.access_token);
      if (data.session.refresh_token) {
        await AsyncStorage.setItem('refreshToken', data.session.refresh_token);
      }
      return true;
    } catch {
      return false;
    }
  },

  /** Error de red o servidor — no implica sesión inválida */
  isRetriableAuthError(err) {
    if (!err?.response) return true;
    if (err.code === 'ECONNABORTED') return true;
    if (err.response.status >= 500) return true;
    return false;
  },
};

export default authService;
