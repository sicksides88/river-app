import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/auth.service';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://river-backend-idio.onrender.com/api').replace('/api', '');

export interface TrackedDriver {
  deliveryId: string;
  lat: number;
  lng: number;
  heading?: number;
}

interface DeliveryStatusUpdate {
  deliveryId: string;
  status: string;
}

export function useBusinessTracking(deliveryIds: string[]) {
  const [driverLocations, setDriverLocations] = useState<Map<string, TrackedDriver>>(new Map());
  const [statusUpdates, setStatusUpdates] = useState<Map<string, string>>(new Map());
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (deliveryIds.length === 0) return;

    const token = authService.getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('delivery:driver_location', (data: { deliveryId: string; location: { lat: number; lng: number; heading?: number } }) => {
      if (deliveryIds.includes(data.deliveryId) && data.location) {
        setDriverLocations(prev => {
          const next = new Map(prev);
          next.set(data.deliveryId, {
            deliveryId: data.deliveryId,
            lat: data.location.lat,
            lng: data.location.lng,
            heading: data.location.heading,
          });
          return next;
        });
      }
    });

    socket.on('delivery:status_changed', (data: DeliveryStatusUpdate) => {
      if (deliveryIds.includes(data.deliveryId)) {
        setStatusUpdates(prev => {
          const next = new Map(prev);
          next.set(data.deliveryId, data.status);
          return next;
        });
      }
    });

    // El cadete canceló: el envío vuelve a 'pending' y se re-ofrece. Sacar el cadete del mapa.
    socket.on('delivery:reassigning', (data: { deliveryId: string }) => {
      if (deliveryIds.includes(data.deliveryId)) {
        setStatusUpdates(prev => {
          const next = new Map(prev);
          next.set(data.deliveryId, 'pending');
          return next;
        });
        setDriverLocations(prev => {
          const next = new Map(prev);
          next.delete(data.deliveryId);
          return next;
        });
      }
    });

    socket.on('delivery:accepted', (data: { deliveryId: string }) => {
      if (deliveryIds.includes(data.deliveryId)) {
        setStatusUpdates(prev => {
          const next = new Map(prev);
          next.set(data.deliveryId, 'confirmed');
          return next;
        });
      }
    });

    socket.on('delivery:assigned', (data: { deliveryId: string }) => {
      if (deliveryIds.includes(data.deliveryId)) {
        setStatusUpdates(prev => {
          const next = new Map(prev);
          next.set(data.deliveryId, 'confirmed');
          return next;
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [deliveryIds.join(',')]);

  const getDriverLocation = useCallback((deliveryId: string) => {
    return driverLocations.get(deliveryId) || null;
  }, [driverLocations]);

  const getStatus = useCallback((deliveryId: string) => {
    return statusUpdates.get(deliveryId) || null;
  }, [statusUpdates]);

  return { driverLocations, statusUpdates, connected, getDriverLocation, getStatus };
}
