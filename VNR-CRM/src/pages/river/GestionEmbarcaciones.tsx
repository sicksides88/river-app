import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/layout';
import { ExportExcelButton, SearchSelect, SearchSelectOption, FieldLabel, VesselTypePicker } from '../../components/common';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { auxilioAdminService } from '../../services/auxilioAdmin.service';
import { riverUsersService, PatrolVessel } from '../../services/riverUsers.service';
import { getVesselTypeLabel, VesselTypeId } from '../../constants/vesselTypes';
import { Anchor, Loader2, Pencil, Plus, Search, Ship, Trash2, User, UserPlus, X } from 'lucide-react';
import { VESSEL_TYPE_IDS } from '../../constants/vesselTypes';

function patrolVesselDisplayName(v: PatrolVessel) {
  const name = v.brand || v.model;
  if (name && v.plate_number && name !== v.plate_number) {
    return `${name} (${v.plate_number})`;
  }
  return name || v.plate_number || v.id.slice(0, 8);
}

function patrolVesselType(v: PatrolVessel) {
  return v.specs?.hull_type || v.model || '';
}

function patronDisplayName(driver?: { nombre?: string; apellido?: string } | null) {
  if (!driver) return '';
  return `${driver.nombre || ''} ${driver.apellido || ''}`.trim();
}

function formatPatrolFeedback(res: {
  previousDriver?: { nombre: string; apellido: string } | null;
  replaced?: boolean;
  unassigned?: boolean;
  vessel?: PatrolVessel;
}, newPatronLabel?: string) {
  if (res.unassigned && res.previousDriver) {
    const prev = patronDisplayName(res.previousDriver);
    return `Patrón desasignado. Antes: ${prev}. La embarcación quedó sin patrón.`;
  }
  if (res.replaced && res.previousDriver) {
    const prev = patronDisplayName(res.previousDriver);
    const next =
      newPatronLabel ||
      patronDisplayName(res.vessel?.driver) ||
      'nuevo patrón';
    return `Patrón reemplazado: ${prev} → ${next}`;
  }
  if (newPatronLabel) {
    return `Patrón ${newPatronLabel} asignado correctamente`;
  }
  return 'Embarcación actualizada';
}

const emptyForm = {
  nombre: '',
  tipo: 'Motor' as VesselTypeId,
  matricula: '',
  capacidad: '6',
  color: '',
};

const GestionEmbarcaciones: React.FC = () => {
  const [vessels, setVessels] = useState<PatrolVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Filtros de la tabla (independientes del formulario de alta)
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPatronId, setFilterPatronId] = useState('');
  const [filterPatronLabel, setFilterPatronLabel] = useState('');
  const [quickVesselId, setQuickVesselId] = useState('');
  const [quickVesselLabel, setQuickVesselLabel] = useState('');

  // Formulario de alta
  const [formPatronId, setFormPatronId] = useState('');
  const [formPatronLabel, setFormPatronLabel] = useState('');
  const [form, setForm] = useState(emptyForm);

  // Reasignar patrón en embarcación existente
  const [reassignVesselId, setReassignVesselId] = useState('');
  const [reassignVesselLabel, setReassignVesselLabel] = useState('');
  const [reassignPatronId, setReassignPatronId] = useState('');
  const [reassignPatronLabel, setReassignPatronLabel] = useState('');
  const [reassignVesselMeta, setReassignVesselMeta] = useState<PatrolVessel | null>(null);
  const [reassigning, setReassigning] = useState(false);

  // Editar embarcación
  const [editingVessel, setEditingVessel] = useState<PatrolVessel | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editPatronId, setEditPatronId] = useState('');
  const [editPatronLabel, setEditPatronLabel] = useState('');

  const toast = useToast();
  const { canWrite } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await riverUsersService.listPatrolVessels({
        search: filterSearch || undefined,
        driverId: filterPatronId || undefined,
      });
      setVessels(res.vessels || []);
    } catch {
      toast.error('Error al cargar flota');
    } finally {
      setLoading(false);
    }
  }, [filterSearch, filterPatronId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const searchPatrons = useCallback(
    (query: string) => auxilioAdminService.searchPatronsAsOptions(query),
    []
  );

  const searchVesselsInFleet = useCallback(async (query: string): Promise<SearchSelectOption[]> => {
    const res = await riverUsersService.listPatrolVessels({
      search: query || undefined,
      driverId: filterPatronId || undefined,
    });
    return (res.vessels || []).map((v) => ({
      id: v.id,
      label: patrolVesselDisplayName(v),
      sublabel: v.driver
        ? `Patrón: ${v.driver.nombre} ${v.driver.apellido}${v.plate_number ? ` · Reg. ${v.plate_number}` : ''}`
        : v.plate_number || undefined,
    }));
  }, [filterPatronId]);

  const searchAllVessels = useCallback(async (query: string): Promise<SearchSelectOption[]> => {
    const res = await riverUsersService.listPatrolVessels({ search: query || undefined });
    return (res.vessels || []).map((v) => ({
      id: v.id,
      label: patrolVesselDisplayName(v),
      sublabel: v.driver
        ? `Patrón actual: ${v.driver.nombre} ${v.driver.apellido}`
        : 'Sin patrón asignado',
    }));
  }, []);

  const handleFilterPatron = (id: string, option: SearchSelectOption | null) => {
    setFilterPatronId(id);
    setFilterPatronLabel(option?.label || '');
  };

  const handleFormPatron = (id: string, option: SearchSelectOption | null) => {
    setFormPatronId(id);
    setFormPatronLabel(option?.label || '');
  };

  const handleVesselQuickFilter = (id: string, option: SearchSelectOption | null) => {
    setQuickVesselId(id);
    setQuickVesselLabel(option?.label || '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatronId) {
      toast.error('Seleccioná el patrón al que pertenece esta embarcación');
      return;
    }
    if (!form.nombre.trim() && !form.matricula.trim()) {
      toast.error('Indicá al menos el nombre o la matrícula de la embarcación');
      return;
    }
    if (!form.tipo) {
      toast.error('Seleccioná el tipo de embarcación');
      return;
    }
    setSaving(true);
    try {
      await riverUsersService.createPatrolVessel(formPatronId, {
        brand: form.nombre.trim(),
        name: form.nombre.trim(),
        type: form.tipo,
        plate_number: form.matricula.trim() || form.nombre.trim(),
        capacity: Number(form.capacidad) || 6,
        color: form.color.trim() || undefined,
      });
      toast.success('Embarcación registrada y asignada al patrón');
      setForm(emptyForm);
      setFormPatronId('');
      setFormPatronLabel('');
      setShowForm(false);
      load();
    } catch {
      toast.error('Error al registrar la embarcación');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta embarcación de la flota?')) return;
    try {
      await riverUsersService.deletePatrolVessel(id);
      toast.success('Embarcación eliminada');
      load();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const resolveVesselMeta = async (id: string): Promise<PatrolVessel | null> => {
    const local = vessels.find((v) => v.id === id);
    if (local) return local;
    const res = await riverUsersService.listPatrolVessels({});
    return res.vessels?.find((v) => v.id === id) || null;
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignVesselId || !reassignPatronId) {
      toast.error('Seleccioná la embarcación y el patrón');
      return;
    }

    const current = reassignVesselMeta;
    const prevName = patronDisplayName(current?.driver);
    const newName = reassignPatronLabel;

    if (current?.driver_id && current.driver_id !== reassignPatronId) {
      const ok = window.confirm(
        `Esta embarcación está asignada a ${prevName}.\n\n` +
          `Al confirmar, el patrón se reemplazará automáticamente por ${newName}.\n\n¿Continuar?`
      );
      if (!ok) return;
    }

    setReassigning(true);
    try {
      const res = await riverUsersService.updatePatrolVessel(reassignVesselId, {
        driver_id: reassignPatronId,
      });
      toast.success(formatPatrolFeedback(res, newName));
      setReassignVesselId('');
      setReassignVesselLabel('');
      setReassignPatronId('');
      setReassignPatronLabel('');
      setReassignVesselMeta(null);
      load();
    } catch {
      toast.error('No se pudo asignar el patrón');
    } finally {
      setReassigning(false);
    }
  };

  const handleUnassign = async (vesselId: string, vesselMeta?: PatrolVessel | null) => {
    const meta = vesselMeta || (await resolveVesselMeta(vesselId));
    const prevName = patronDisplayName(meta?.driver);
    if (!meta?.driver_id) {
      toast.error('Esta embarcación no tiene patrón asignado');
      return;
    }
    const ok = window.confirm(
      `¿Desasignar a ${prevName} de esta embarcación?\n\nLa embarcación quedará en la flota sin patrón hasta que asignes uno nuevo.`
    );
    if (!ok) return;

    try {
      const res = await riverUsersService.updatePatrolVessel(vesselId, { unassign: true });
      toast.success(formatPatrolFeedback(res));
      if (reassignVesselId === vesselId) {
        setReassignVesselId('');
        setReassignVesselLabel('');
        setReassignVesselMeta(null);
      }
      if (editingVessel?.id === vesselId) {
        setEditPatronId('');
        setEditPatronLabel('');
        setEditingVessel({ ...editingVessel, driver_id: null, driver: undefined });
      }
      load();
    } catch {
      toast.error('No se pudo desasignar el patrón. ¿Ejecutaste el patch SQL en Supabase?');
    }
  };

  const openEdit = (v: PatrolVessel) => {
    const tipoRaw = patrolVesselType(v);
    const tipo = VESSEL_TYPE_IDS.includes(tipoRaw as VesselTypeId)
      ? (tipoRaw as VesselTypeId)
      : 'Motor';
    setEditingVessel(v);
    setEditForm({
      nombre: v.brand || v.specs?.display_name || '',
      tipo,
      matricula: v.plate_number || '',
      capacidad: String(v.capacity ?? 6),
      color: v.color || '',
    });
    setEditPatronId(v.driver_id || '');
    setEditPatronLabel(
      v.driver ? `${v.driver.nombre} ${v.driver.apellido}`.trim() : ''
    );
  };

  const closeEdit = () => {
    setEditingVessel(null);
    setEditForm(emptyForm);
    setEditPatronId('');
    setEditPatronLabel('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVessel) return;
    if (!editForm.nombre.trim() && !editForm.matricula.trim()) {
      toast.error('Indicá al menos el nombre o la matrícula');
      return;
    }

    const prevName = patronDisplayName(editingVessel.driver);
    const patronChanged =
      editPatronId && editingVessel.driver_id && editPatronId !== editingVessel.driver_id;

    if (patronChanged) {
      const ok = window.confirm(
        `El patrón actual es ${prevName}.\n\n` +
          `Se reemplazará por ${editPatronLabel} al guardar.\n\n¿Continuar?`
      );
      if (!ok) return;
    }

    if (!editPatronId && editingVessel.driver_id) {
      toast.error('Usá "Desasignar patrón" si querés quitar al patrón actual');
      return;
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof riverUsersService.updatePatrolVessel>[1] = {
        brand: editForm.nombre.trim(),
        name: editForm.nombre.trim(),
        type: editForm.tipo,
        plate_number: editForm.matricula.trim() || editForm.nombre.trim(),
        capacity: Number(editForm.capacidad) || 6,
        color: editForm.color.trim() || undefined,
      };
      if (editPatronId) payload.driver_id = editPatronId;

      const res = await riverUsersService.updatePatrolVessel(editingVessel.id, payload);
      toast.success(
        patronChanged
          ? formatPatrolFeedback(res, editPatronLabel || undefined)
          : 'Embarcación actualizada'
      );
      closeEdit();
      load();
    } catch {
      toast.error('Error al actualizar la embarcación');
    } finally {
      setSaving(false);
    }
  };

  const displayedVessels = quickVesselId
    ? vessels.filter((v) => v.id === quickVesselId)
    : vessels;

  return (
    <Layout title="Flota de auxilio">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Embarcaciones de auxilio</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Cada embarcación pertenece a un patrón. Podés registrar nuevas, editarlas o reasignar el patrón
            de embarcaciones ya existentes.
          </p>
        </div>
        <ExportExcelButton
          filename="flota-auxilio-river"
          headers={['nombre', 'tipo', 'matricula', 'patron', 'capacidad', 'estado']}
          getRows={async () => {
            const res = await riverUsersService.listPatrolVessels({
              search: filterSearch || undefined,
              driverId: filterPatronId || undefined,
            });
            return (res.vessels || []).map((v) => [
              v.brand || v.specs?.display_name || '',
              getVesselTypeLabel(patrolVesselType(v)),
              v.plate_number || '',
              v.driver ? `${v.driver.nombre} ${v.driver.apellido}` : '',
              v.capacity ?? '',
              v.is_active !== false ? 'Activa' : 'Inactiva',
            ]);
          }}
        />
      </div>

      {/* —— Buscar en la flota —— */}
      <section className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          Buscar en la flota
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SearchSelect
            label="Patrón"
            placeholder="Todos los patrones"
            searchPlaceholder="Buscar patrón por nombre, email o teléfono…"
            value={filterPatronId}
            selectedLabel={filterPatronLabel}
            onChange={handleFilterPatron}
            onSearch={searchPatrons}
            minSearchLength={0}
            allowClear
            emptyMessage="No hay patrones registrados"
            help="Filtrá la tabla para ver solo las embarcaciones de un patrón determinado."
          />
          <SearchSelect
            label="Embarcación"
            placeholder="Todas las embarcaciones"
            searchPlaceholder="Buscar por nombre o matrícula…"
            value={quickVesselId}
            selectedLabel={quickVesselLabel}
            onChange={handleVesselQuickFilter}
            onSearch={searchVesselsInFleet}
            minSearchLength={0}
            allowClear
            emptyMessage="No hay embarcaciones en la flota"
            help="Buscá una embarcación existente por su nombre comercial o número de matrícula."
          />
          <div>
            <FieldLabel
              htmlFor="filter-text"
              label="Texto libre"
              help="Filtrá la tabla escribiendo parte del nombre, modelo o matrícula de la embarcación."
            />
            <input
              id="filter-text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Delta, AR-1234…"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* —— Reasignar patrón a embarcación existente —— */}
      {canWrite && (
        <section className="bg-white rounded-xl shadow border border-amber-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            Asignar o cambiar patrón
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Elegí una embarcación ya registrada y asignale un patrón. Si ya tenía otro patrón, se
            reemplaza automáticamente y te avisamos al confirmar.
          </p>
          <form onSubmit={handleReassign} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SearchSelect
              label="Embarcación existente"
              placeholder="Buscar embarcación…"
              searchPlaceholder="Nombre o matrícula"
              value={reassignVesselId}
              selectedLabel={reassignVesselLabel}
              onChange={async (id, opt) => {
                setReassignVesselId(id);
                setReassignVesselLabel(opt?.label || '');
                if (id) {
                  setReassignVesselMeta(await resolveVesselMeta(id));
                } else {
                  setReassignVesselMeta(null);
                }
              }}
              onSearch={searchAllVessels}
              minSearchLength={0}
              required
              emptyMessage="No hay embarcaciones en la flota"
              help="Embarcación de auxilio que querés vincular o reasignar a un patrón."
            />
            <SearchSelect
              label="Patrón"
              placeholder="Buscar patrón…"
              searchPlaceholder="Nombre, email o teléfono"
              value={reassignPatronId}
              selectedLabel={reassignPatronLabel}
              onChange={(id, opt) => {
                setReassignPatronId(id);
                setReassignPatronLabel(opt?.label || '');
              }}
              onSearch={searchPatrons}
              minSearchLength={0}
              required
              emptyMessage="No hay patrones activos"
              help="Patrón que operará esta embarcación. Reemplaza al patrón anterior si existía."
            />
            <div className="flex flex-col gap-2 justify-end">
            <button
              type="submit"
              disabled={reassigning || !reassignVesselId || !reassignPatronId}
              className="inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {reassigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Asignar patrón
            </button>
            <button
              type="button"
              disabled={!reassignVesselId || !reassignVesselMeta?.driver_id}
              onClick={() => handleUnassign(reassignVesselId, reassignVesselMeta)}
              className="inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Desasignar patrón
            </button>
            </div>
            </div>
            {reassignVesselMeta?.driver && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Patrón actual: <strong>{patronDisplayName(reassignVesselMeta.driver)}</strong>
                {reassignPatronId && reassignPatronId !== reassignVesselMeta.driver_id && (
                  <> — al asignar, se reemplazará por <strong>{reassignPatronLabel}</strong></>
                )}
              </p>
            )}
            {reassignVesselMeta && !reassignVesselMeta.driver_id && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                Esta embarcación no tiene patrón asignado.
              </p>
            )}
          </form>
        </section>
      )}

      {/* —— Alta: nueva embarcación —— */}
      {canWrite && (
        <section className="mb-6">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Registrar embarcación y asignar patrón
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden"
            >
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Ship className="w-5 h-5 text-blue-600" />
                  Nueva embarcación de auxilio
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Primero elegí el patrón responsable; después completá los datos de la embarcación.
                </p>
              </div>

              <div className="p-6 space-y-8">
                {/* Paso 1 — Patrón */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                      1
                    </span>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-500" />
                      Patrón responsable
                    </span>
                  </div>
                  <div className="pl-9 max-w-lg">
                    <SearchSelect
                      label="Patrón asignado"
                      placeholder="Buscar y seleccionar patrón…"
                      searchPlaceholder="Nombre, apellido, email o teléfono"
                      value={formPatronId}
                      selectedLabel={formPatronLabel}
                      onChange={handleFormPatron}
                      onSearch={searchPatrons}
                      minSearchLength={0}
                      required
                      emptyMessage="No hay patrones activos"
                      help="Persona patrón que operará esta embarcación. Buscá por nombre, email o teléfono."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      El patrón será quien opere esta embarcación en los auxilios y turnos de guardia.
                    </p>
                  </div>
                </div>

                {/* Paso 2 — Datos de la embarcación */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                      2
                    </span>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <Anchor className="w-4 h-4 text-gray-500" />
                      Datos de la embarcación
                    </span>
                  </div>
                  <div className="pl-9 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                    <div className="md:col-span-2">
                      <FieldLabel
                        htmlFor="v-nombre"
                        label="Nombre de la embarcación"
                        required
                        help="Nombre con el que se identifica la lancha en operaciones. Ej: Patrulla Delta, Guardia Norte, RHIB 01."
                      />
                      <input
                        id="v-nombre"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Patrulla Delta"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <VesselTypePicker
                        value={form.tipo}
                        onChange={(tipo) => setForm({ ...form, tipo })}
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel
                        htmlFor="v-matricula"
                        label="Matrícula / registro"
                        help="Número oficial de matrícula, dominio náutico o identificador interno de River Service. Ej: AR-12345, RS-004."
                      />
                      <input
                        id="v-matricula"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: AR-12345"
                        value={form.matricula}
                        onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                      />
                    </div>

                    <div>
                      <FieldLabel
                        htmlFor="v-capacidad"
                        label="Capacidad (personas)"
                        help="Cantidad máxima de personas que puede transportar la embarcación, incluido el patrón."
                      />
                      <input
                        id="v-capacidad"
                        type="number"
                        min={1}
                        max={50}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        value={form.capacidad}
                        onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                      />
                    </div>

                    <div>
                      <FieldLabel
                        htmlFor="v-color"
                        label="Color (opcional)"
                        help="Color predominante de la embarcación. Ayuda a identificarla en el mapa y en el despacho."
                      />
                      <input
                        id="v-color"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Blanco con franja azul"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || !formPatronId}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Registrar embarcación
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                    setFormPatronId('');
                    setFormPatronLabel('');
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* —— Tabla —— */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Flota registrada
              <span className="ml-2 text-sm font-normal text-gray-400">({displayedVessels.length})</span>
            </h2>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Matrícula</th>
                <th className="px-4 py-3 text-left">Patrón asignado</th>
                <th className="px-4 py-3 text-left">Capacidad</th>
                <th className="px-4 py-3 text-left">Estado</th>
                {canWrite && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedVessels.length === 0 ? (
                <tr>
                  <td colSpan={canWrite ? 7 : 6} className="px-4 py-12 text-center text-gray-400">
                    {filterSearch || filterPatronId || quickVesselId
                      ? 'No hay embarcaciones que coincidan con la búsqueda'
                      : 'Aún no hay embarcaciones en la flota'}
                  </td>
                </tr>
              ) : (
                displayedVessels.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.brand || v.specs?.display_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{getVesselTypeLabel(patrolVesselType(v))}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{v.plate_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.driver ? (
                        patronDisplayName(v.driver)
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Sin patrón
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{v.capacity != null ? `${v.capacity} pers.` : '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          v.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.is_active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(v)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar embarcación"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Eliminar embarcación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* —— Modal editar embarcación —— */}
      {editingVessel && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-600" />
                  Editar embarcación
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Modificá datos o reasigná el patrón responsable.
                </p>
              </div>
              <button type="button" onClick={closeEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div>
                <SearchSelect
                  label="Patrón asignado"
                  placeholder={editPatronId ? 'Buscar patrón…' : 'Sin patrón — buscar para asignar'}
                  searchPlaceholder="Nombre, apellido, email o teléfono"
                  value={editPatronId}
                  selectedLabel={editPatronLabel}
                  onChange={(id, opt) => {
                    setEditPatronId(id);
                    setEditPatronLabel(opt?.label || '');
                  }}
                  onSearch={searchPatrons}
                  minSearchLength={0}
                  allowClear
                  help="Podés cambiar el patrón o desasignarlo con el botón de abajo."
                />
                {editingVessel.driver && editPatronId && editPatronId !== editingVessel.driver_id && (
                  <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Se reemplazará <strong>{patronDisplayName(editingVessel.driver)}</strong> por{' '}
                    <strong>{editPatronLabel}</strong> al guardar.
                  </p>
                )}
                {editingVessel.driver_id && (
                  <button
                    type="button"
                    onClick={() => handleUnassign(editingVessel.id, editingVessel)}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Desasignar patrón actual
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel
                    htmlFor="edit-nombre"
                    label="Nombre de la embarcación"
                    required
                    help="Nombre operativo de la lancha."
                  />
                  <input
                    id="edit-nombre"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <VesselTypePicker
                    value={editForm.tipo}
                    onChange={(tipo) => setEditForm({ ...editForm, tipo })}
                    required
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="edit-matricula" label="Matrícula" help="Dominio o registro náutico." />
                  <input
                    id="edit-matricula"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    value={editForm.matricula}
                    onChange={(e) => setEditForm({ ...editForm, matricula: e.target.value })}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="edit-capacidad" label="Capacidad" help="Personas incluido el patrón." />
                  <input
                    id="edit-capacidad"
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    value={editForm.capacidad}
                    onChange={(e) => setEditForm({ ...editForm, capacidad: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel htmlFor="edit-color" label="Color" help="Opcional." />
                  <input
                    id="edit-color"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GestionEmbarcaciones;
