import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, pushNotificationService, driverService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('client'); // 'client' | 'driver'

  // Verificar autenticación al iniciar la app
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verificar si hay una sesión activa
   */
  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = await authService.getStoredToken();

      if (token) {
        // Verificar que el token sea válido con el servidor
        const response = await authService.getMe();
        setUser(response.user);
        setIsAuthenticated(true);

        // Cargar modo activo desde AsyncStorage
        const storedMode = await AsyncStorage.getItem('activeMode');
        if (storedMode === 'client' || storedMode === 'driver') {
          setActiveMode(storedMode);
        }

        // Registrar para push notifications (sesión existente)
        pushNotificationService.register().catch((err) => {
          console.warn('Push notification registration failed:', err);
        });
      }
    } catch (err) {
      // Token inválido o expirado, limpiar solo localmente (sin llamar al server)
      await authService.clearLocal();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);

      // Registrar para push notifications
      pushNotificationService.register().catch((err) => {
        console.warn('Push notification registration failed:', err);
      });

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);

      let errorMessage = 'Error al iniciar sesión';

      if (err.response?.data?.message) {
        // Error del servidor con mensaje
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (err.response?.status === 404) {
        errorMessage = 'Usuario no encontrado';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Error en el servidor. Intenta más tarde.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. Verifica tu conexión.';
      } else if (err.message?.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica que el servidor esté corriendo.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registrar nuevo usuario
   */
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);

      // Registrar para push notifications
      pushNotificationService.register().catch((err) => {
        console.warn('Push notification registration failed:', err);
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al registrarse';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      setLoading(true);

      // Si está en modo conductor, marcar como no disponible
      if (activeMode === 'driver') {
        await driverService.updateAvailability(false, 0, 0).catch((err) => {
          console.warn('Driver availability update on logout failed:', err);
        });
      }

      // Desregistrar push notifications
      await pushNotificationService.unregister().catch((err) => {
        console.warn('Push notification unregister failed:', err);
      });

      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  /**
   * Actualizar perfil del usuario
   */
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Cambiar entre modo cliente y conductor
   */
  const switchMode = async (mode) => {
    setActiveMode(mode);
    await AsyncStorage.setItem('activeMode', mode);
  };

  /**
   * Limpiar errores
   */
  const clearError = () => setError(null);

  /**
   * Refrescar datos del usuario desde el servidor
   */
  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (err) {
      console.error('Error refreshing user:', err);
      return { success: false };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    activeMode,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    refreshUser,
    clearError,
    switchMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
