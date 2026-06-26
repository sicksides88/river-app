import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket.service';
import { useSocketContext } from '../context/SocketContext';

/**
 * Hook para manejar conexión de Socket.IO
 * Usa el SocketContext que mantiene la conexión a nivel de app
 */
export const useSocket = () => {
  // Usar el contexto de socket que ya maneja la conexión
  const socketContext = useSocketContext();

  return {
    isConnected: socketContext.isConnected,
    connectionError: socketContext.connectionError,
    connect: socketContext.connect,
    disconnect: socketContext.disconnect,
    socket: socketContext.socket,
  };
};

/**
 * Hook para escuchar eventos de viaje en tiempo real
 * @param {string} rideId - ID del viaje
 * @param {Object} callbacks - Callbacks para eventos
 */
export const useRideSocket = (rideId, callbacks = {}) => {
  const { socket, isConnected } = useSocket();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!rideId || !isConnected) return;

    // Unirse al room del viaje
    socket.joinRide(rideId);

    // Listeners de eventos
    const unsubStatusChanged = socket.on('ride:status_changed', (data) => {
      if (data.rideId === rideId) {
        callbacksRef.current.onStatusChanged?.(data);
      }
    });

    const unsubAccepted = socket.on('ride:accepted', (data) => {
      if (data.rideId === rideId) {
        callbacksRef.current.onAccepted?.(data);
      }
    });

    const unsubDriverLocation = socket.on('driver:location', (data) => {
      callbacksRef.current.onDriverLocation?.(data);
    });

    const unsubEtaChanged = socket.on('ride:eta_changed', (data) => {
      if (data.rideId === rideId) {
        callbacksRef.current.onEtaChanged?.(data);
      }
    });

    return () => {
      socket.leaveRide(rideId);
      unsubStatusChanged();
      unsubAccepted();
      unsubDriverLocation();
      unsubEtaChanged();
    };
  }, [rideId, isConnected, socket]);

  return { isConnected };
};

/**
 * Hook para conductores - escuchar nuevos viajes y envíos disponibles
 * @param {Object} callbacks - Callbacks para eventos
 */
export const useDriverSocket = (callbacks = {}) => {
  const { socket, isConnected } = useSocket();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!isConnected) return;

    // Eventos de viajes
    const unsubNewRequest = socket.on('ride:new_request', (data) => {
      callbacksRef.current.onNewRideRequest?.(data);
    });

    const unsubRideTaken = socket.on('ride:taken', (data) => {
      callbacksRef.current.onRideTaken?.(data);
    });

    const unsubStatusChanged = socket.on('driver:status_changed', (data) => {
      callbacksRef.current.onStatusChanged?.(data);
    });

    // Eventos de envíos/deliveries
    const unsubNewDelivery = socket.on('delivery:new_request', (data) => {
      callbacksRef.current.onNewDeliveryRequest?.(data);
    });

    const unsubDeliveryTaken = socket.on('delivery:taken', (data) => {
      callbacksRef.current.onDeliveryTaken?.(data);
    });

    return () => {
      unsubNewRequest();
      unsubRideTaken();
      unsubStatusChanged();
      unsubNewDelivery();
      unsubDeliveryTaken();
    };
  }, [isConnected, socket]);

  // Métodos para el conductor
  const goOnline = useCallback((location) => {
    socket.goOnline(location);
  }, [socket]);

  const goOffline = useCallback(() => {
    socket.goOffline();
  }, [socket]);

  const acceptRide = useCallback((rideId) => {
    socket.acceptRide(rideId);
  }, [socket]);

  const acceptDelivery = useCallback((deliveryId, vehicleId) => {
    socket.acceptDelivery(deliveryId, vehicleId);
  }, [socket]);

  return {
    isConnected,
    goOnline,
    goOffline,
    acceptRide,
    acceptDelivery,
  };
};

/**
 * Hook para enviar ubicación del conductor
 * @param {string} rideId - ID del viaje activo (opcional)
 * @param {boolean} isActive - Si está activo el tracking
 */
export const useLocationTracking = (rideId = null, isActive = false) => {
  const { socket, isConnected } = useSocket();
  const intervalRef = useRef(null);

  const sendLocation = useCallback((location) => {
    if (!isConnected) return;

    socket.updateLocation({
      rideId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading || 0,
      speed: location.coords.speed || 0,
      accuracy: location.coords.accuracy || 0,
    });
  }, [isConnected, rideId, socket]);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    sendLocation,
    isConnected,
  };
};

export default useSocket;
