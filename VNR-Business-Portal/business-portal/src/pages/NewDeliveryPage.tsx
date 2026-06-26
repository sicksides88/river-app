import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AddressInput from '../components/AddressInput';
import { businessService, type PriceEstimate } from '../services/business.service';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, DollarSign, MapPin, Clock, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface AddressData {
  address: string;
  lat: number;
  lng: number;
}

const NewDeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { business } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [pickup, setPickup] = useState<AddressData>({ address: '', lat: 0, lng: 0 });
  const [dropoff, setDropoff] = useState<AddressData>({ address: '', lat: 0, lng: 0 });
  const [pickupContact, setPickupContact] = useState({ name: '', phone: '' });
  const [dropoffContact, setDropoffContact] = useState({ name: '', phone: '' });
  const [packageDescription, setPackageDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingPickup, setLoadingPickup] = useState(false);

  // Estimación de precio
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Pre-cargar la dirección del comercio como origen
  useEffect(() => {
    if (!business?.address) return;

    // Si el business ya tiene coordenadas guardadas, usarlas directamente
    if (business.address_lat && business.address_lng) {
      setPickup({
        address: business.address,
        lat: business.address_lat,
        lng: business.address_lng,
      });
      setPickupContact({ name: business.name || '', phone: business.phone || '' });
      return;
    }

    // Si no tiene coordenadas, geocodificar
    setLoadingPickup(true);
    api.get('/maps/geocode', { params: { address: business.address } })
      .then(({ data }) => {
        if (data.success && data.data) {
          setPickup({
            address: data.data.formattedAddress || business.address!,
            lat: data.data.coordinates?.latitude || 0,
            lng: data.data.coordinates?.longitude || 0,
          });
        } else {
          setPickup({ address: business.address!, lat: 0, lng: 0 });
        }
      })
      .catch(() => {
        setPickup({ address: business.address!, lat: 0, lng: 0 });
      })
      .finally(() => setLoadingPickup(false));

    setPickupContact({ name: business.name || '', phone: business.phone || '' });
  }, [business]);

  const handleEstimatePrice = async () => {
    if (!pickup.address || !dropoff.address) {
      toast.error('Completá la dirección de destino');
      return;
    }

    setEstimating(true);
    setEstimate(null);
    setConfirmed(false);
    try {
      const result = await businessService.estimatePrice(
        { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
        { address: dropoff.address, lat: dropoff.lat, lng: dropoff.lng }
      );
      setEstimate(result);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo calcular el precio');
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estimate || !confirmed) {
      toast.error('Primero calculá el precio y confirmá');
      return;
    }

    setLoading(true);
    try {
      const delivery = await businessService.createDelivery({
        pickup: {
          address: pickup.address,
          lat: pickup.lat,
          lng: pickup.lng,
          contactName: pickupContact.name || undefined,
          contactPhone: pickupContact.phone || undefined,
        },
        dropoff: {
          address: dropoff.address,
          lat: dropoff.lat,
          lng: dropoff.lng,
          contactName: dropoffContact.name || undefined,
          contactPhone: dropoffContact.phone || undefined,
        },
        packageDescription: packageDescription || undefined,
        notes: notes || undefined,
      });
      toast.success('Envío solicitado. Se te asignará un cadete.');
      navigate(`/envios/${delivery.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear envío');
    } finally {
      setLoading(false);
    }
  };

  const handleDropoffChange = (result: AddressData) => {
    setDropoff(result);
    setEstimate(null);
    setConfirmed(false);
  };

  return (
    <Layout>
      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Envío</h1>
          <p className="text-gray-500 text-sm">Solicitá un cadete para tu entrega</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origen y Destino lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Origen - Pre-cargado con dirección del comercio */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Origen (retiro)</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de retiro</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={loadingPickup ? 'Cargando ubicación...' : pickup.address}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Ubicación predeterminada de tu comercio</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                    <input
                      type="text"
                      value={pickupContact.name}
                      onChange={(e) => setPickupContact({ ...pickupContact, name: e.target.value })}
                      placeholder="Nombre"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={pickupContact.phone}
                      onChange={(e) => setPickupContact({ ...pickupContact, phone: e.target.value })}
                      placeholder="Teléfono"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Destino - Con mapa y sugerencias */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Destino (entrega)</h2>
              <div className="space-y-3">
                <AddressInput
                  label="Dirección de entrega"
                  placeholder="Escribí la dirección de destino"
                  value={dropoff.address}
                  onChange={handleDropoffChange}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                    <input
                      type="text"
                      value={dropoffContact.name}
                      onChange={(e) => setDropoffContact({ ...dropoffContact, name: e.target.value })}
                      placeholder="Destinatario"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={dropoffContact.phone}
                      onChange={(e) => setDropoffContact({ ...dropoffContact, phone: e.target.value })}
                      placeholder="Teléfono"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paquete + Botón en una fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Detalles del paquete</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="Ej: Caja de helados, sobre con documentos..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales para el cadete..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Precio / Acción */}
            <div className="flex flex-col justify-end">
              {!estimate ? (
                <button
                  type="button"
                  onClick={handleEstimatePrice}
                  disabled={estimating || !pickup.address || !dropoff.address}
                  className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {estimating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Calculando precio...
                    </>
                  ) : (
                    'Calcular precio'
                  )}
                </button>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-gray-900 p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-900">${estimate.price.toLocaleString('es-AR')}</p>
                      <p className="text-xs text-gray-500">Precio</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-900">{estimate.distance} km</p>
                      <p className="text-xs text-gray-500">Distancia</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-900">{estimate.duration} min</p>
                      <p className="text-xs text-gray-500">Tiempo est.</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Base: ${estimate.breakdown.base.toLocaleString('es-AR')} + ${estimate.breakdown.perKm.toLocaleString('es-AR')}/km x {estimate.breakdown.distanceKm} km
                  </p>

                  {!confirmed ? (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setEstimate(null); setConfirmed(false); }}
                        className="flex-1 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                      >
                        Recalcular
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmed(true)}
                        className="flex-1 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors text-sm"
                      >
                        Confirmar precio
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Solicitando cadete...
                        </>
                      ) : (
                        `Solicitar cadete - $${estimate.price.toLocaleString('es-AR')}`
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewDeliveryPage;
