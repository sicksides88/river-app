import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { SearchSelect, SearchSelectOption } from '../../components/common';
import { useRealtimeAuxilios } from '../../hooks/useRealtimeAuxilios';
import { auxilioAdminService, AdminAuxilio, PatrolOnDuty } from '../../services/auxilioAdmin.service';
import { riverUsersService } from '../../services/riverUsers.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  getEmergencyTypeLabel,
  getPriorityLabel,
  isDangerEmergency,
} from '../../constants/auxilioLabels';
import {
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Sailboat,
  Ship,
  User,
  Users,
} from 'lucide-react';

function patronDisplayName(p: PatrolOnDuty) {
  return `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Patrón';
}

function priorityTone(priority?: number | null, override?: number | null) {
  const value = override ?? priority;
  if (value === 0) return 'urgent';
  if (value === 1) return 'high';
  return 'normal';
}

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cola y asignación manual</h1>
        <p className="mt-1 text-sm text-gray-500">
          Elegí primero el patrón en guardia, después la embarcación si hace falta, y confirmá la
          asignación.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border border-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">En cola</p>
            <p className="text-lg font-semibold text-gray-900">{pending.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">Patrones en guardia</p>
            <p className="text-lg font-semibold text-gray-900">{patrols.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <Sailboat className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No hay auxilios pendientes en cola</p>
          <p className="text-sm text-gray-500 mt-1">Los nuevos pedidos aparecerán acá para asignar.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pending.map((a, index) => {
            const tone = priorityTone(a.priority, a.priorityOverride);
            const danger = isDangerEmergency(a.emergencyType);
            const patronSelected = selectedDriver[a.id];
            const selectedPatron = patrols.find((p) => p.id === patronSelected);

            return (
              <article
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-400">#{index + 1} en cola</span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                          tone === 'urgent'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : tone === 'high'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {getPriorityLabel(a.priority, a.priorityOverride)}
                      </span>
                      {a.emergencyType && (
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                            danger
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}
                        >
                          {getEmergencyTypeLabel(a.emergencyType)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {a.vessel?.name || a.vesselName || 'Embarcación sin nombre'}
                    </h2>
                    {a.pickup?.address && (
                      <p className="text-sm text-gray-500 mt-1 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{a.pickup.address}</span>
                      </p>
                    )}
                    {a.user && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                        <User className="w-4 h-4 shrink-0 text-gray-400" />
                        {`${a.user.nombre || ''} ${a.user.apellido || ''}`.trim()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link
                      to={`/auxilios/${a.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver detalle
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    {canWrite && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePriority(a.id, 0)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            tone === 'urgent'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                          }`}
                        >
                          Urgente
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePriority(a.id, 2)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            tone === 'normal'
                              ? 'bg-gray-700 text-white border-gray-700'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Normal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {canWrite && (
                  <div className="p-5 bg-gray-50/60 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                          1
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900">Elegí el patrón en guardia</h3>
                        <span className="text-xs text-red-600 font-medium">Obligatorio</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-8 mb-3">
                        Tocá un patrón disponible. Es el primer paso antes de asignar la embarcación.
                      </p>

                      {patrols.length === 0 ? (
                        <div className="ml-8 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          No hay patrones en guardia. Revisá los turnos antes de asignar.
                        </div>
                      ) : (
                        <div className="ml-8 flex flex-wrap gap-2">
                          {patrols.map((p) => {
                            const selected = patronSelected === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => selectPatron(a.id, p)}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm rounded-xl border transition-all ${
                                  selected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                                }`}
                              >
                                {selected && <Check className="w-4 h-4 shrink-0" />}
                                <span className="font-medium">{patronDisplayName(p)}</span>
                                {p.telefono_numero && (
                                  <span className={`text-xs ${selected ? 'text-blue-100' : 'text-gray-400'}`}>
                                    · {p.telefono_numero}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedPatron && (
                        <p className="ml-8 mt-2 text-xs text-blue-700 font-medium">
                          Patrón seleccionado: {patronDisplayName(selectedPatron)}
                        </p>
                      )}
                    </div>

                    <div className={patronSelected ? '' : 'opacity-50 pointer-events-none select-none'}>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            patronSelected ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          2
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900">Embarcación de auxilio</h3>
                        <span className="text-xs text-gray-400 font-medium">Opcional</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-8 mb-3">
                        {patronSelected
                          ? 'Podés elegir la embarcación del patrón o dejar que use la asignada en flota.'
                          : 'Primero seleccioná un patrón para habilitar este paso.'}
                      </p>
                      <div className="ml-8 max-w-xl">
                        <SearchSelect
                          label=""
                          placeholder="Buscar embarcación de flota…"
                          value={vehicleByAuxilio[a.id] || ''}
                          selectedLabel={vehicleLabels[a.id]}
                          onChange={(id, opt) => {
                            setVehicleByAuxilio({ ...vehicleByAuxilio, [a.id]: id });
                            setVehicleLabels({ ...vehicleLabels, [a.id]: opt?.label || '' });
                          }}
                          onSearch={searchPatrolVessels(a.id)}
                          minSearchLength={0}
                          emptyMessage={
                            patronSelected
                              ? 'Sin embarcaciones para este patrón'
                              : 'Seleccioná un patrón primero'
                          }
                        />
                      </div>
                    </div>

                    <div className={patronSelected ? '' : 'opacity-50 pointer-events-none select-none'}>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            patronSelected ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          3
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900">Tiempo estimado de llegada</h3>
                      </div>
                      <p className="text-xs text-gray-500 ml-8 mb-3">
                        Minutos que tardará el patrón en llegar al lugar del auxilio.
                      </p>
                      <div className="ml-8 flex items-center gap-3 max-w-xs">
                        <input
                          type="number"
                          min={1}
                          max={240}
                          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={getEta(a.id)}
                          onChange={(e) =>
                            setEtaByAuxilio({ ...etaByAuxilio, [a.id]: Number(e.target.value) || 30 })
                          }
                        />
                        <span className="text-sm text-gray-500">minutos</span>
                      </div>
                    </div>

                    <div className="ml-8 pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={assigning === a.id || !patronSelected}
                        onClick={() => handleAssign(a)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      >
                        {assigning === a.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Asignando…
                          </>
                        ) : (
                          <>
                            <Ship className="w-4 h-4" />
                            Confirmar asignación
                          </>
                        )}
                      </button>
                      {!patronSelected && (
                        <span className="text-xs text-gray-500">Seleccioná un patrón para continuar</span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default DespachoAuxilios;
