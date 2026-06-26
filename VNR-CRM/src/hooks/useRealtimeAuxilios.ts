import { useCallback, useEffect, useState } from 'react';
import { auxilioAdminService, AdminAuxilio } from '../services/auxilioAdmin.service';

export const useRealtimeAuxilios = (status = 'active', intervalMs = 15000) => {
  const [auxilios, setAuxilios] = useState<AdminAuxilio[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    inProgress: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const res = await auxilioAdminService.listAuxilios(status);
      setAuxilios(res.auxilios || []);
      setStats(res.stats || { active: 0, pending: 0, inProgress: 0, completedToday: 0 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error cargando auxilios';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refetch();
    const id = setInterval(refetch, intervalMs);
    return () => clearInterval(id);
  }, [refetch, intervalMs]);

  return { auxilios, stats, loading, error, refetch };
};

export default useRealtimeAuxilios;
