import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Layout } from '../../components/layout';
import { SearchSelect, SearchSelectOption } from '../../components/common';
import { auxilioAdminService, NavigatorVessel } from '../../services/auxilioAdmin.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const mapStyle = { width: '100%', height: '280px' };
const defaultCenter = { lat: -34.6037, lng: -58.3816 };
const MANUAL_VESSEL_ID = '__manual__';

const AltaAuxilioTelefonico: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { canWrite } = useAuth();
  const [loading, setLoading] = useState(false);
  const [navigatorLabel, setNavigatorLabel] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [vessels, setVessels] = useState<NavigatorVessel[]>([]);
  const [vesselsLoading, setVesselsLoading] = useState(false);
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [vesselLabel, setVesselLabel] = useState('');
  const [form, setForm] = useState({
    lat: '',
    lng: '',
    address: '',
    emergencyType: 'mecanica',
    vesselName: '',
  });

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-alta',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const searchNavigators = useCallback(
    (query: string) => auxilioAdminService.searchUsersAsOptions(query),
    []
  );

  const loadVesselsForUser = async (userId: string) => {
    setVesselsLoading(true);
    setVessels([]);
    setSelectedVesselId('');
    setVesselLabel('');
    setForm((prev) => ({ ...prev, vesselName: '' }));

    try {
      const res = await auxilioAdminService.getUserVessels(userId);
      const list = res.vessels || [];
      setVessels(list);

      if (list.length === 1) {
        const vessel = list[0];
        setSelectedVesselId(vessel.id);
        setVesselLabel(vessel.name || 'Sin nombre');
        setForm((prev) => ({ ...prev, vesselName: vessel.name || '' }));
      }
    } catch {
      toast.error('No se pudieron cargar las embarcaciones del navegante');
      setVessels([]);
    } finally {
      setVesselsLoading(false);
    }
  };

  const handleNavigatorChange = (id: string, option: SearchSelectOption | null) => {
    setSelectedUserId(id);
    setNavigatorLabel(option?.label || '');

    if (id) {
      loadVesselsForUser(id);
    } else {
      setVessels([]);
      setSelectedVesselId('');
      setVesselLabel('');
      setForm((prev) => ({ ...prev, vesselName: '' }));
    }
  };

  const searchVessels = useCallback(
    async (query: string) => {
      const term = query.trim().toLowerCase();
      const filtered = vessels.filter((v) => {
        if (!term) return true;
        const name = (v.name || '').toLowerCase();
        const reg = (v.registration || '').toLowerCase();
        return name.includes(term) || reg.includes(term);
      });

      const options: SearchSelectOption[] = filtered.map((v) => ({
        id: v.id,
        label: v.name || 'Sin nombre',
        sublabel: [v.registration, v.type].filter(Boolean).join(' · ') || undefined,
      }));

      options.push({
        id: MANUAL_VESSEL_ID,
        label: 'Otra embarcación (ingresar manualmente)',
        sublabel: 'Usar si no está en el listado',
      });

      return options;
    },
    [vessels]
  );

  const handleVesselChange = (id: string, option: SearchSelectOption | null) => {
    setSelectedVesselId(id);
    setVesselLabel(option?.label || '');

    if (id === MANUAL_VESSEL_ID) {
      setForm((prev) => ({ ...prev, vesselName: '' }));
      return;
    }

    const vessel = vessels.find((v) => v.id === id);
    setForm((prev) => ({ ...prev, vesselName: vessel?.name || '' }));
  };

  const mapCenter =
    form.lat && form.lng
      ? { lat: Number(form.lat), lng: Number(form.lng) }
      : defaultCenter;

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setForm((prev) => ({
      ...prev,
      lat: e.latLng!.lat().toFixed(6),
      lng: e.latLng!.lng().toFixed(6),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!selectedUserId) {
      toast.error('Seleccioná un navegante');
      return;
    }

    if (vessels.length > 0 && !selectedVesselId) {
      toast.error('Seleccioná una embarcación');
      return;
    }

    if (
      (vessels.length === 0 || selectedVesselId === MANUAL_VESSEL_ID) &&
      !form.vesselName.trim()
    ) {
      toast.error('Ingresá el nombre de la embarcación');
      return;
    }

    setLoading(true);
    try {
      const selectedVessel =
        selectedVesselId && selectedVesselId !== MANUAL_VESSEL_ID
          ? vessels.find((v) => v.id === selectedVesselId)
          : undefined;

      const res = await auxilioAdminService.createAuxilio({
        userId: selectedUserId,
        pickup: {
          address: form.address || undefined,
          coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
        },
        emergencyType: form.emergencyType,
        vessel: selectedVessel
          ? {
              id: selectedVessel.id,
              name: selectedVessel.name,
              registration: selectedVessel.registration,
            }
          : form.vesselName.trim()
            ? { name: form.vesselName.trim() }
            : undefined,
      });

      toast.success('Auxilio creado');
      const id = res.auxilio?.id;
      if (id) navigate(`/auxilios/${id}`);
      else navigate('/despacho');
    } catch {
      toast.error('No se pudo crear el auxilio');
    } finally {
      setLoading(false);
    }
  };

  const showManualVesselInput =
    vessels.length === 0 || selectedVesselId === MANUAL_VESSEL_ID;

  return (
    <Layout title="Alta telefónica">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Alta telefónica de auxilio</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 max-w-2xl space-y-4">
        <SearchSelect
          label="Navegante"
          placeholder="Seleccionar navegante…"
          searchPlaceholder="Buscar por nombre, email o teléfono"
          value={selectedUserId}
          selectedLabel={navigatorLabel}
          onChange={handleNavigatorChange}
          onSearch={searchNavigators}
          minSearchLength={2}
          required
          emptyMessage="Escribí al menos 2 caracteres para buscar"
        />

        {selectedUserId && vesselsLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando embarcaciones…
          </div>
        )}

        {selectedUserId && !vesselsLoading && vessels.length > 0 && (
          <SearchSelect
            label="Embarcación"
            placeholder="Seleccionar embarcación…"
            searchPlaceholder="Buscar por nombre o matrícula"
            value={selectedVesselId}
            selectedLabel={vesselLabel}
            onChange={handleVesselChange}
            onSearch={searchVessels}
            minSearchLength={0}
            required
            emptyMessage="Sin embarcaciones para este navegante"
          />
        )}

        {selectedUserId && !vesselsLoading && vessels.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Este navegante no tiene embarcaciones registradas. Podés ingresar el nombre manualmente.
          </p>
        )}

        {showManualVesselInput && selectedUserId && !vesselsLoading && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre embarcación</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.vesselName}
              onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
              placeholder="Nombre de la embarcación"
              required={vessels.length === 0}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo emergencia</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.emergencyType}
            onChange={(e) => setForm({ ...form, emergencyType: e.target.value })}
          >
            <option value="via_agua">Vía agua</option>
            <option value="salud">Salud</option>
            <option value="mecanica">Mecánica</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación del auxilio (clic en mapa o coordenadas)
          </label>
          {loadError ? (
            <p className="text-sm text-red-600 mb-2">No se pudo cargar el mapa</p>
          ) : !isLoaded ? (
            <div className="flex justify-center py-12 border rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapStyle}
              center={mapCenter}
              zoom={form.lat ? 12 : 10}
              onClick={handleMapClick}
            >
              {form.lat && form.lng && (
                <Marker position={{ lat: Number(form.lat), lng: Number(form.lng) }} />
              )}
            </GoogleMap>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
            <input
              type="number"
              step="any"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
            <input
              type="number"
              step="any"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / dirección</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {canWrite ? (
          <button
            type="submit"
            disabled={loading || !selectedUserId}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Creando…' : 'Crear auxilio y despachar'}
          </button>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
            Tu rol de auditor es de solo lectura. No podés crear auxilios desde esta pantalla.
          </p>
        )}
      </form>
    </Layout>
  );
};

export default AltaAuxilioTelefonico;
