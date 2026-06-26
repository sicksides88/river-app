import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { driversService } from '../services';
import type { DriverAvailability } from '../types/database';

interface UseRealtimeDriversReturn {
  drivers: DriverAvailability[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRealtimeDrivers = (): UseRealtimeDriversReturn => {
  const [drivers, setDrivers] = useState<DriverAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setError(null);
      const data = await driversService.getOnlineDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Error al cargar conductores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch inicial
    fetchDrivers();

    // Configurar suscripción en tiempo real
    const channel: RealtimeChannel = supabase
      .channel('driver_availability_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_availability',
        },
        async (payload) => {
          console.log('Cambio en driver_availability:', payload);
          // Refetch todos los conductores para mantener consistencia
          await fetchDrivers();
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción realtime:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Suscrito exitosamente a cambios de driver_availability');
        }
      });

    // Cleanup de la suscripción al desmontar
    return () => {
      console.log('Desuscribiendo del canal realtime');
      supabase.removeChannel(channel);
    };
  }, [fetchDrivers]);

  return {
    drivers,
    loading,
    error,
    refetch: fetchDrivers,
  };
};

export default useRealtimeDrivers;
