import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

/**
 * SocketProvider - Mantiene la conexión WebSocket activa cuando el usuario está autenticado
 * Debe envolver los componentes que necesitan acceso a tiempo real
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Conectar socket
  const connect = useCallback(async () => {
    // Evitar múltiples conexiones simultáneas
    if (!isAuthenticated || isConnectingRef.current || socketService.isConnected()) {
      return;
    }

    isConnectingRef.current = true;

    try {
      setConnectionError(null);
      await socketService.connect();

      // Verificar si realmente se conectó
      if (socketService.isConnected()) {
        setIsConnected(true);
        console.log('Socket conectado desde SocketProvider');
      } else {
        console.warn('Socket: connect() completó pero no está conectado');
        setIsConnected(false);
      }
    } catch (error) {
      // Solo loguear, no es crítico para la app
      console.warn('Socket no disponible:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);

      // Reintentar conexión después de 10 segundos (silenciosamente)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isAuthenticated) {
          connect();
        }
      }, 10000);
    } finally {
      isConnectingRef.current = false;
    }
  }, [isAuthenticated]);

  // Desconectar socket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socketService.disconnect();
    setIsConnected(false);
    console.log('Socket desconectado desde SocketProvider');
  }, []);

  // Manejar cambios de estado de la app (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App volvió al foreground, reconectar si es necesario
        if (isAuthenticated && !socketService.isConnected()) {
          console.log('App en foreground, reconectando socket...');
          connect();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, connect]);

  // Conectar cuando el usuario se autentica, desconectar al cerrar sesión
  useEffect(() => {
    if (isAuthenticated) {
      // Delay de 1.5s para asegurar que el token esté guardado en AsyncStorage
      const timer = setTimeout(() => {
        connect();
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  // Escuchar eventos de conexión del socket
  // Se re-ejecuta cuando isConnected cambia para asegurar que los listeners estén configurados
  useEffect(() => {
    // Solo configurar listeners si hay socket disponible
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      console.log('Socket desconectado:', reason);
    };

    const handleError = (error) => {
      setConnectionError(error.message);
      console.warn('Socket error:', error.message);
    };

    const unsubConnect = socketService.on('connect', handleConnect);
    const unsubDisconnect = socketService.on('disconnect', handleDisconnect);
    const unsubError = socketService.on('connect_error', handleError);

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubError();
    };
  }, [isConnected]); // Re-ejecutar cuando cambie el estado de conexión

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    isConnected,
    connectionError,
    connect,
    disconnect,
    socket: socketService,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de Socket
 */
export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
