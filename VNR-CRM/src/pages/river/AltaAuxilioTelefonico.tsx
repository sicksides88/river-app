import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { auxilioAdminService } from '../../services/auxilioAdmin.service';
import { useToast } from '../../context/ToastContext';

const AltaAuxilioTelefonico: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    lat: '',
    lng: '',
    address: '',
    emergencyType: 'mecanica',
    vesselName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auxilioAdminService.createAuxilio({
        userId: form.userId,
        pickup: {
          address: form.address || undefined,
          coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
        },
        emergencyType: form.emergencyType,
        vessel: form.vesselName ? { name: form.vesselName } : undefined,
      });
      toast.success('Auxilio creado');
      const id = res.auxilio?.id;
      if (id) navigate(`/river/auxilios/${id}`);
      else navigate('/river/despacho');
    } catch {
      toast.error('No se pudo crear el auxilio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Alta telefónica">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Alta telefónica de auxilio</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID navegante (UUID)</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Embarcación</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.vesselName}
            onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
            placeholder="Nombre embarcación"
          />
        </div>
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
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Creando…' : 'Crear auxilio y despachar'}
        </button>
      </form>
    </Layout>
  );
};

export default AltaAuxilioTelefonico;
