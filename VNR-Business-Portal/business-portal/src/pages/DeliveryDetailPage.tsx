import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatusTimeline from '../components/StatusTimeline';
import TrackingMap from '../components/TrackingMap';
import { businessService, type Delivery, type DriverLocation } from '../services/business.service';
import { useDeliveryTracking } from '../hooks/useDeliveryTracking';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Phone, RefreshCw, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [driverLoc, setDriverLoc] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [repeating, setRepeating] = useState(false);

  const tracking = useDeliveryTracking(id || null);

  useEffect(() => {
    if (id) loadDelivery();
  }, [id]);

  const loadDelivery = async () => {
    try {
      const result = await businessService.getDeliveryById(id!);
      setDelivery(result.delivery);
      setDriverLoc(result.driverLocation);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar envío');
    } finally {
      setLoading(false);
    }
  };

  // Update status from socket
  const currentStatus = tracking.status || delivery?.status || '';

  // Update driver location from socket
  const currentDriverLocation = tracking.driverLocation || (driverLoc ? {
    lat: driverLoc.current_latitude,
    lng: driverLoc.current_longitude,
  } : null);

  const handleCancel = async () => {
    if (!delivery || !confirm('¿Seguro que querés cancelar este envío?')) return;
    setCancelling(true);
    try {
      await businessService.cancelDelivery(delivery.id);
      toast.success('Envío cancelado');
      loadDelivery();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  const handleRepeat = async () => {
    if (!delivery) return;
    setRepeating(true);
    try {
      const newDelivery = await businessService.repeatDelivery(delivery.id);
      toast.success('Envío repetido correctamente');
      navigate(`/envios/${newDelivery.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al repetir envío');
    } finally {
      setRepeating(false);
    }
  };

  const canRepeat = ['delivered', 'cancelled'].includes(currentStatus);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  if (!delivery) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-gray-500">Envío no encontrado</p>
          <button onClick={() => navigate('/envios')} className="mt-4 text-sm text-gray-900 font-medium hover:underline">
            Volver a mis envíos
          </button>
        </div>
      </Layout>
    );
  }

  const canCancel = !['delivered', 'cancelled'].includes(currentStatus);

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/envios')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Envío {delivery.tracking_number}</h1>
              <p className="text-gray-500 mt-0.5">
                Creado el {new Date(delivery.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canRepeat && (
              <button
                onClick={handleRepeat}
                disabled={repeating}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${repeating ? 'animate-spin' : ''}`} />
                {repeating ? 'Repitiendo...' : 'Repetir envío'}
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar envío'}
              </button>
            )}
          </div>
        </div>

        {tracking.reassigning && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-800">
            <p className="font-semibold">El cadete canceló el envío</p>
            <p className="text-sm">Estamos buscando otro cadete cercano automáticamente. No necesitás hacer nada.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
              <StatusTimeline currentStatus={currentStatus} />
              {tracking.connected && (
                <p className="text-xs text-green-500 mt-4">En tiempo real</p>
              )}
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Direcciones</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Origen</p>
                  <p className="text-sm text-gray-900 mt-1">{delivery.pickup_address}</p>
                  {delivery.pickup_contact_name && (
                    <p className="text-xs text-gray-500 mt-0.5">{delivery.pickup_contact_name} - {delivery.pickup_contact_phone}</p>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 uppercase font-medium">Destino</p>
                  <p className="text-sm text-gray-900 mt-1">{delivery.dropoff_address}</p>
                  {delivery.dropoff_contact_name && (
                    <p className="text-xs text-gray-500 mt-0.5">{delivery.dropoff_contact_name} - {delivery.dropoff_contact_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Driver */}
            {delivery.driver && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cadete</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {delivery.driver.nombre?.charAt(0)}{delivery.driver.apellido?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{delivery.driver.nombre} {delivery.driver.apellido}</p>
                    {delivery.driver.telefono_numero && (
                      <a
                        href={`tel:${delivery.driver.telefono_numero}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {delivery.driver.telefono_numero}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Package details */}
            {(delivery.package_description || delivery.notes) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles</h2>
                {delivery.package_description && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 uppercase font-medium">Paquete</p>
                    <p className="text-sm text-gray-900 mt-1">{delivery.package_description}</p>
                  </div>
                )}
                {delivery.notes && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Notas</p>
                    <p className="text-sm text-gray-900 mt-1">{delivery.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-[600px]">
              <TrackingMap
                driverLocation={currentDriverLocation}
                pickupLocation={delivery.pickup_lat && delivery.pickup_lng ? {
                  lat: delivery.pickup_lat,
                  lng: delivery.pickup_lng,
                } : null}
                dropoffLocation={delivery.dropoff_lat && delivery.dropoff_lng ? {
                  lat: delivery.dropoff_lat,
                  lng: delivery.dropoff_lng,
                } : null}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DeliveryDetailPage;
