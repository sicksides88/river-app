import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { SearchSelect, SearchSelectOption } from '../../components/common';
import { useRealtimeAuxilios } from '../../hooks/useRealtimeAuxilios';
import { auxilioAdminService, AdminAuxilio, PatrolOnDuty } from '../../services/auxilioAdmin.service';
import { riverUsersService } from '../../services/riverUsers.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const DespachoAuxilios: React.FC = () => {
  const { auxilios, loading, refetch } = useRealtimeAuxilios('active');
  const [patrols, setPatrols] = useState<PatrolOnDuty[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [etaByAuxilio, setEtaByAuxilio] = useState<Record<string, number>>({});
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [vehicleByAuxilio, setVehicleByAuxilio] = useState<Record<string, string>>({});
  const [vehicleLabels, setVehicleLabels] = useState<Record<string, string>>({});
  const toast = useToast();
  const { canWrite } = useAuth();

  useEffect(() => {
    auxilioAdminService.listPatrolsOnDuty().then((r) => setPatrols(r.patrols || []));
  }, []);

  const pending = useMemo(
    () =>
      auxilios
        .filter((a) => a.status === 'pending')
        .sort((a, b) => {
          const pa = a.priorityOverride ?? a.priority ?? 99;
          const pb = b.priorityOverride ?? b.priority ?? 99;
          if (pa !== pb) return pa - pb;
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }),
    [auxilios]
  );

  const getEta = (id: string) => etaByAuxilio[id] ?? 30;

  const searchPatrolVessels = useCallback(
    (auxilioId: string) => async (query: string) => {
      const driverId = selectedDriver[auxilioId];
      const res = await riverUsersService.listPatrolVessels({
        driverId: driverId || undefined,
        search: query || undefined,
      });
      return (res.vessels || [])
        .filter((v) => {
          if (!query) return true;
          const label = [v.brand, v.model, v.plate_number].join(' ').toLowerCase();
          return label.includes(query.toLowerCase());
        })
        .map(
          (v): SearchSelectOption => ({
            id: v.id,
            label: [v.brand, v.model].filter(Boolean).join(' ') || v.plate_number || v.id.slice(0, 8),
            sublabel: v.driver
              ? `${v.driver.nombre} ${v.driver.apellido}${v.plate_number ? ` · ${v.plate_number}` : ''}`
              : v.plate_number,
          })
        );
    },
    [selectedDriver]
  );

  const selectPatron = (auxilioId: string, patron: PatrolOnDuty) => {
    setSelectedDriver({ ...selectedDriver, [auxilioId]: patron.id });
    setVehicleByAuxilio({ ...vehicleByAuxilio, [auxilioId]: '' });
    setVehicleLabels({ ...vehicleLabels, [auxilioId]: '' });
  };

  const handleAssign = async (auxilio: AdminAuxilio) => {
    const driverId = selectedDriver[auxilio.id];
    if (!driverId) {
      toast.error('Seleccioná un patrón en guardia');
      return;
    }
    setAssigning(auxilio.id);
    try {
      const vehicleId = vehicleByAuxilio[auxilio.id] || undefined;
      await auxilioAdminService.assignAuxilio(auxilio.id, {
        driverId,
        etaMinutes: getEta(auxilio.id),
        vehicleId,
      });
      toast.success('Patrón asignado correctamente');
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'No se pudo asignar el patrón');
    } finally {
      setAssigning(null);
    }
  };

  const handlePriority = async (id: string, priority: number) => {
    if (!canWrite) return;
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
                    <p className="font-semibold">
                      {a.vessel?.name || a.vesselName || a.emergencyType || a.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500">{a.pickup?.address}</p>
                    {a.user && (
                      <p className="text-sm text-gray-600 mt-1">
                        {`${a.user.nombre || ''} ${a.user.apellido || ''}`.trim()}
                      </p>
                    )}
                    <Link to={`/auxilios/${a.id}`} className="text-xs text-blue-600 mt-1 inline-block">
                      Ver detalle
                    </Link>
                  </div>
                  {canWrite && (
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
                  )}
                </div>

                {canWrite && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ETA al asignar (minutos)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={240}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={getEta(a.id)}
                          onChange={(e) =>
                            setEtaByAuxilio({ ...etaByAuxilio, [a.id]: Number(e.target.value) || 30 })
                          }
                        />
                      </div>
                      <SearchSelect
                        label="Embarcación patrón (opcional)"
                        placeholder="Seleccionar embarcación de flota…"
                        value={vehicleByAuxilio[a.id] || ''}
                        selectedLabel={vehicleLabels[a.id]}
                        onChange={(id, opt) => {
                          setVehicleByAuxilio({ ...vehicleByAuxilio, [a.id]: id });
                          setVehicleLabels({ ...vehicleLabels, [a.id]: opt?.label || '' });
                        }}
                        onSearch={searchPatrolVessels(a.id)}
                        minSearchLength={0}
                        emptyMessage={
                          selectedDriver[a.id]
                            ? 'Sin embarcaciones para este patrón'
                            : 'Seleccioná un patrón primero o buscá en toda la flota'
                        }
                      />
                    </div>

                    <p className="text-sm font-medium text-gray-700 mb-2">Patrones en guardia:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {patrols.length === 0 ? (
                        <span className="text-sm text-gray-400">Sin patrones en guardia</span>
                      ) : (
                        patrols.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPatron(a.id, p)}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              selectedDriver[a.id] === p.id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {p.nombre} {p.apellido}
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={assigning === a.id || !selectedDriver[a.id]}
                      onClick={() => handleAssign(a)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {assigning === a.id ? 'Asignando…' : 'Confirmar asignación'}
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default DespachoAuxilios;
