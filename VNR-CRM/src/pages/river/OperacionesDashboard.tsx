import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { StatCard } from '../../components/common';
import { useRealtimeAuxilios } from '../../hooks/useRealtimeAuxilios';
import { auxilioAdminService } from '../../services/auxilioAdmin.service';
import { Anchor, Clock, AlertTriangle, CheckCircle, Loader2, Users } from 'lucide-react';

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Asignado',
  arrived: 'Arribado',
  in_progress: 'En servicio',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

const OperacionesDashboard: React.FC = () => {
  const { auxilios, stats, loading, error, refetch } = useRealtimeAuxilios('active');
  const [patrolsOnDuty, setPatrolsOnDuty] = useState(0);

  useEffect(() => {
    auxilioAdminService.listPatrolsOnDuty().then((r) => setPatrolsOnDuty(r.patrols?.length || 0));
    const t = setInterval(() => {
      auxilioAdminService.listPatrolsOnDuty().then((r) => setPatrolsOnDuty(r.patrols?.length || 0));
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <Layout title="River Service — Operaciones">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard auxilios</h1>
          <p className="text-gray-500 text-sm">Cola operativa en tiempo real</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Activos" value={stats.active} icon={Anchor} color="blue" />
        <StatCard title="En cola" value={stats.pending} icon={Clock} color="yellow" />
        <StatCard title="En servicio" value={stats.inProgress} icon={AlertTriangle} color="purple" />
        <StatCard title="Completados hoy" value={stats.completedToday} icon={CheckCircle} color="green" />
        <StatCard title="Patrones en guardia" value={patrolsOnDuty} icon={Users} color="blue" />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Auxilios activos</h2>
          <Link to="/despacho" className="text-sm text-blue-600 hover:underline">
            Ver despacho →
          </Link>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : auxilios.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No hay auxilios activos</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {auxilios.map((a) => (
              <Link
                key={a.id}
                to={`/auxilios/${a.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {a.vessel?.name || a.vesselName || 'Embarcación'} · {a.emergencyType || 'auxilio'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {a.user ? `${a.user.nombre || ''} ${a.user.apellido || ''}`.trim() : '—'}
                      {a.etaMinutes ? ` · ETA ${a.etaMinutes} min` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-md">
                      {a.pickup?.address || 'Sin dirección'}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                    {statusLabel[a.status] || a.riverStatus || a.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OperacionesDashboard;
