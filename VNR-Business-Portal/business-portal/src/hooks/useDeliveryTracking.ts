import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/auth.service';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://river-backend-idio.onrender.com/api').replace('/api', '');

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
}

interface TrackingState {
  status: string | null;
  driverLocation: DriverLocation | null;
  connected: boolean;
  reassigning: boolean;
}

export function useDeliveryTracking(deliveryId: string | null): TrackingState {
  const [status, setStatus] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!deliveryId) return;

    const token = authService.getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for status changes
    socket.on('delivery:status_changed', (data: { deliveryId: string; status: string; reassigning?: boolean }) => {
      if (data.deliveryId === deliveryId) {
        setStatus(data.status);
        if (data.reassigning) {
          setReassigning(true);
          setDriverLocation(null);
        } else if (data.status && data.status !== 'pending') {
          setReassigning(false);
        }
      }
    });

    // El cadete canceló: el envío se está re-ofreciendo a otro cadete
    socket.on('delivery:reassigning', (data: { deliveryId: string }) => {
      if (data.deliveryId === deliveryId) {
        setStatus('pending');
        setReassigning(true);
        setDriverLocation(null);
      }
    });

    // Listen for driver location updates
    socket.on('delivery:driver_location', (data: { deliveryId: string; location: { lat: number; lng: number; heading?: number } }) => {
      if (data.deliveryId === deliveryId && data.location) {
        setDriverLocation({ lat: data.location.lat, lng: data.location.lng, heading: data.location.heading });
      }
    });

    // Listen for delivery accepted (otro cadete tomó el envío re-ofrecido)
    socket.on('delivery:accepted', (data: { deliveryId: string }) => {
      if (data.deliveryId === deliveryId) {
        setStatus('confirmed');
        setReassigning(false);
      }
    });

    // Listen for assigned event
    socket.on('delivery:assigned', (data: { deliveryId: string }) => {
      if (data.deliveryId === deliveryId) {
        setStatus('confirmed');
        setReassigning(false);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [deliveryId]);

  return { status, driverLocation, connected, reassigning };
}
