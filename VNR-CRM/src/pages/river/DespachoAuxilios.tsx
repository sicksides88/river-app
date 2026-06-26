import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { useRealtimeAuxilios } from '../../hooks/useRealtimeAuxilios';
import { auxilioAdminService, AdminAuxilio, PatrolOnDuty } from '../../services/auxilioAdmin.service';
import { useToast } from '../../context/ToastContext';
import { Loader2 } from 'lucide-react';

const DespachoAuxilios: React.FC = () => {
  const { auxilios, loading, refetch } = useRealtimeAuxilios('active');
  const [patrols, setPatrols] = useState<PatrolOnDuty[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    auxilioAdminService.listPatrolsOnDuty().then((r) => setPatrols(r.patrols || []));
  }, []);

  const pending = auxilios.filter((a) => a.status === 'pending');

  const handleAssign = async (auxilio: AdminAuxilio, driverId: string) => {
    setAssigning(auxilio.id);
    try {
      await auxilioAdminService.assignAuxilio(auxilio.id, { driverId, etaMinutes: 30 });
      toast.success('Patrón asignado correctamente');
      refetch();
    } catch {
      toast.error('No se pudo asignar el patrón');
    } finally {
      setAssigning(null);
    }
  };

  const handlePriority = async (id: string, priority: number) => {
    try {
      await auxilioAdminService.setPriority(id, priority);
      toast.success('Prioridad actualizada');
      refetch();
    } catch {
      toast.error('Error al actualizar prioridad');
    }
  };

  return (
    <Layout title="Despacho de auxilios">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cola y asignación manual</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <p className="text-gray-500">No hay auxilios pendientes en cola</p>
          ) : (
            pending.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold">{a.vesselName || a.emergencyType || a.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{a.pickup?.address}</p>
                    <Link to={`/river/auxilios/${a.id}`} className="text-xs text-blue-600 mt-1 inline-block">
                      Ver detalle
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePriority(a.id, 0)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded"
                    >
                      Urgente
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriority(a.id, 2)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                    >
                      Normal
                    </button>
                  </div>
                </div>

                <p className="text-sm font-medium text-gray-700 mb-2">Asignar patrón:</p>
                <div className="flex flex-wrap gap-2">
                  {patrols.length === 0 ? (
                    <span className="text-sm text-gray-400">Sin patrones en guardia</span>
                  ) : (
                    patrols.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={assigning === a.id}
                        onClick={() => handleAssign(a, p.id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {p.nombre} {p.apellido}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default DespachoAuxilios;
