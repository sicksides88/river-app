import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapViewWrapper } from '../../components/common';
import { ServiceTrackingCard } from '../../components/services';
import * as WebBrowser from 'expo-web-browser';
import { useSocketContext } from '../../context/SocketContext';
import { deliveryService, mapsService, paymentService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// DeliveryTrackingScreen - Pantalla de seguimiento de envío en tiempo real
const DeliveryTrackingScreen = ({ navigation, route }) => {
  const { delivery: initialDelivery, driver: initialDriver, deliveryId, paymentMethod } = route.params || {};
  const { socket, isConnected } = useSocketContext();

  const [delivery, setDelivery] = useState(initialDelivery);
  const [driver, setDriver] = useState(initialDriver);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(initialDriver?.eta || 5);
  const [status, setStatus] = useState(initialDelivery?.status || 'confirmed');
  const [isLoading, setIsLoading] = useState(!initialDelivery && !!deliveryId);

  // Cargar datos del delivery si solo se proporciona deliveryId
  useEffect(() => {
    const loadDeliveryData = async () => {
      if (initialDelivery || !deliveryId) return;

      try {
        setIsLoading(true);
        const response = await deliveryService.getDeliveryById(deliveryId);

        if (response.success && response.delivery) {
          const fetchedDelivery = response.delivery;

          // Formatear delivery para que coincida con la estructura esperada
          const formattedDelivery = {
            id: fetchedDelivery.id,
            status: fetchedDelivery.status,
            pickup: {
              address: fetchedDelivery.pickup?.address,
              lat: fetchedDelivery.pickup?.coordinates?.lat,
              lng: fetchedDelivery.pickup?.coordinates?.lng,
            },
            dropoff: {
              address: fetchedDelivery.dropoff?.address,
              lat: fetchedDelivery.dropoff?.coordinates?.lat,
              lng: fetchedDelivery.dropoff?.coordinates?.lng,
            },
            estimatedPrice: fetchedDelivery.estimatedPrice,
          };

          setDelivery(formattedDelivery);
          setStatus(fetchedDelivery.status);

          // Si hay información del conductor
          if (fetchedDelivery.driverInfo) {
            setDriver({
              id: fetchedDelivery.driverInfo.id,
              name: fetchedDelivery.driverInfo.name,
              avatar: fetchedDelivery.driverInfo.avatar,
              phone: fetchedDelivery.driverInfo.phone,
              rating: fetchedDelivery.driverInfo.rating,
              vehicle: fetchedDelivery.driverInfo.vehicle,
              vehicleColor: fetchedDelivery.driverInfo.vehicleColor,
              plate: fetchedDelivery.driverInfo.plate,
            });
          }
        }
      } catch (error) {
        console.error('Error loading delivery:', error);
        Alert.alert('Error', 'No se pudo cargar la información del envío');
      } finally {
        setIsLoading(false);
      }
    };

    loadDeliveryData();
  }, [deliveryId, initialDelivery]);

  // Direcciones
  const pickupAddress = delivery?.pickup?.address || 'Punto de retiro';
  const dropoffAddress = delivery?.dropoff?.address || 'Punto de entrega';


  // Coordenadas de pickup y dropoff
  const pickupCoords = delivery?.pickup ? {
    lat: delivery.pickup.lat || delivery.pickup.coordinates?.lat,
    lng: delivery.pickup.lng || delivery.pickup.coordinates?.lng,
  } : null;

  const dropoffCoords = delivery?.dropoff ? {
    lat: delivery.dropoff.lat || delivery.dropoff.coordinates?.lat,
    lng: delivery.dropoff.lng || delivery.dropoff.coordinates?.lng,
  } : null;

  // Estados antes de llegar al punto de retiro (solo cuando va EN CAMINO al pickup)
  const isGoingToPickup = ['confirmed', 'accepted'].includes(status);

  // Refs para valores que se usan en el listener del socket (para evitar re-suscripciones)
  const isGoingToPickupRef = useRef(isGoingToPickup);
  const pickupCoordsRef = useRef(pickupCoords);
  const dropoffCoordsRef = useRef(dropoffCoords);

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    isGoingToPickupRef.current = isGoingToPickup;
  }, [isGoingToPickup]);

  useEffect(() => {
    pickupCoordsRef.current = pickupCoords;
  }, [pickupCoords]);

  useEffect(() => {
    dropoffCoordsRef.current = dropoffCoords;
  }, [dropoffCoords]);

  // Helper para calcular distancia entre dos puntos (en metros)
  const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Radio de la tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Coordenadas para el mapa - dinámicas según el estado
  // Antes de recoger: conductor → pickup (o pickup → dropoff si no hay ubicación del conductor)
  // Después de recoger: conductor → dropoff
  const origin = React.useMemo(() => {
    const currentDest = isGoingToPickup ? pickupCoords : dropoffCoords;

    // Si tenemos ubicación del conductor
    if (driverLocation && currentDest) {
      // Calcular distancia al destino actual
      const distance = getDistanceMeters(
        driverLocation.latitude, driverLocation.longitude,
        currentDest.lat, currentDest.lng
      );

      // Si el conductor está muy cerca del destino (< 100m), mostrar ruta estática
      if (distance < 100) {
        return pickupCoords ? { ...pickupCoords, title: 'Punto de retiro' } : null;
      }

      return {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
        title: 'Conductor',
      };
    }
    // Sin ubicación del conductor, mostrar ruta estática pickup → dropoff
    return pickupCoords ? { ...pickupCoords, title: 'Punto de retiro' } : null;
  }, [driverLocation, pickupCoords, dropoffCoords, isGoingToPickup]);

  const destination = React.useMemo(() => {
    // Si tenemos ubicación del conductor
    if (driverLocation) {
      // Si va al pickup, destino es pickup
      if (isGoingToPickup) {
        return pickupCoords ? { ...pickupCoords, title: 'Punto de retiro' } : null;
      }
      // Si ya recogió, destino es dropoff
      return dropoffCoords ? { ...dropoffCoords, title: 'Punto de entrega' } : null;
    }
    // Sin ubicación del conductor, mostrar ruta estática pickup → dropoff
    return dropoffCoords ? { ...dropoffCoords, title: 'Punto de entrega' } : null;
  }, [driverLocation, isGoingToPickup, pickupCoords, dropoffCoords]);


  // Marcadores adicionales para mostrar ambos puntos (no afectan el zoom)
  const additionalMarkers = React.useMemo(() => {
    const markers = [];
    if (isGoingToPickup && dropoffCoords) {
      // Mostrar destino final cuando va al pickup (sin afectar zoom)
      markers.push({
        id: 'dropoff',
        coordinate: {
          latitude: dropoffCoords.lat,
          longitude: dropoffCoords.lng,
        },
        title: 'Punto de entrega',
        color: '#FF3B30',
        excludeFromFit: true,
      });
    } else if (!isGoingToPickup && pickupCoords) {
      // Mostrar pickup cuando ya recogió (sin afectar zoom)
      markers.push({
        id: 'pickup',
        coordinate: {
          latitude: pickupCoords.lat,
          longitude: pickupCoords.lng,
        },
        title: 'Punto de retiro',
        color: '#888888',
        excludeFromFit: true,
      });
    }
    return markers;
  }, [isGoingToPickup, pickupCoords, dropoffCoords]);

  // Escuchar eventos de socket
  useEffect(() => {
    if (!isConnected || !socket || !delivery?.id) {
      return;
    }

    // Ubicación del conductor en tiempo real
    let lastEtaCalc = 0;
    const ETA_CALC_INTERVAL = 30000; // Calcular ETA cada 30 segundos

    const unsubLocation = socket.on('delivery:driver_location', async (data) => {
      if (data.deliveryId === delivery.id) {
        const newLocation = {
          latitude: data.location.lat,
          longitude: data.location.lng,
          heading: data.location.heading || 0,
        };
        setDriverLocation(newLocation);

        // Calcular ETA periódicamente
        const now = Date.now();
        if (now - lastEtaCalc > ETA_CALC_INTERVAL) {
          lastEtaCalc = now;

          // Usar refs para obtener los valores actuales (evita re-suscripciones)
          const currentDest = isGoingToPickupRef.current ? pickupCoordsRef.current : dropoffCoordsRef.current;

          if (currentDest && mapsService?.calculateETA) {
            try {
              const etaData = await mapsService.calculateETA(
                { latitude: newLocation.latitude, longitude: newLocation.longitude },
                { latitude: currentDest.lat, longitude: currentDest.lng }
              );
              if (etaData?.duration?.value) {
                const minutes = Math.ceil(etaData.duration.value / 60);
                setEta(minutes);
              }
            } catch (err) {
              // Error silencioso en cálculo de ETA
            }
          }
        }
      }
    });

    // Cambios de estado del envío
    const unsubStatus = socket.on('delivery:status_changed', (data) => {
      if (data.deliveryId === delivery.id) {
        setStatus(data.status);

        // Si se entregó, procesar pago si es MP/card y luego ir al rating
        if (data.status === 'delivered') {
          if (paymentMethod === 'mercadopago' || paymentMethod === 'card') {
            processMercadoPagoPayment();
          } else {
            goToRating();
          }
        }

        // Si se canceló
        if (data.status === 'cancelled') {
          Alert.alert(
            'Envío cancelado',
            data.reason || 'El envío ha sido cancelado.',
            [{
              text: 'OK',
              onPress: () => navigation.goBack(),
            }]
          );
        }

        // Si el cadete canceló, el envío se re-ofrece a otro: NO se cierra la pantalla
        if (data.cancelledBy === 'driver' || data.reassigning) {
          setStatus('pending');
          setDriver(null);
          setDriverLocation(null);
          Alert.alert(
            'El cadete canceló',
            'Estamos buscando otro cadete cercano. Te avisamos cuando alguien lo tome.'
          );
        }
      }
    });

    // El cadete canceló: el envío se está re-ofreciendo a otro cadete
    const unsubReassigning = socket.on('delivery:reassigning', (data) => {
      if (data.deliveryId === delivery.id) {
        setStatus('pending');
        setDriver(null);
        setDriverLocation(null);
        Alert.alert(
          'El cadete canceló',
          'Estamos buscando otro cadete cercano. Te avisamos cuando alguien lo tome.'
        );
      }
    });

    // Compat: evento viejo (por si alguna versión del backend lo emite)
    const unsubDriverCancelled = socket.on('delivery:driver_cancelled', (data) => {
      if (data.deliveryId === delivery.id) {
        setStatus('pending');
        setDriver(null);
        setDriverLocation(null);
      }
    });

    // Actualización de ETA
    const unsubEta = socket.on('delivery:eta_changed', (data) => {
      if (data.deliveryId === delivery.id) {
        setEta(data.eta);
      }
    });

    return () => {
      unsubLocation();
      unsubStatus();
      unsubEta();
      unsubReassigning();
      unsubDriverCancelled();
    };
  }, [isConnected, socket, delivery?.id, driver, navigation]);

  // Service info
  const serviceType = delivery?.serviceType || 'envio';
  const serviceName = serviceType === 'flete' ? 'Flete' : 'Envío';
  const servicePrice = delivery?.estimatedPrice;

  const getStatusText = () => {
    const etaText = eta ? ` · ${eta} min` : '';
    switch (status) {
      case 'confirmed':
        return `Conductor en camino al retiro${etaText}`;
      case 'arrived_pickup':
        return 'Conductor llegó al punto de retiro';
      case 'picked-up':
      case 'picked_up':
        return 'Paquete recogido';
      case 'in-transit':
      case 'in_transit':
        return `En camino a la entrega${etaText}`;
      case 'arrived_dropoff':
        return 'Conductor llegó al destino';
      case 'delivered':
        return 'Entregado';
      default:
        return 'En proceso';
    }
  };

  // Navegar al rating
  const goToRating = () => {
    navigation.replace('RateRide', {
      deliveryId: delivery.id,
      type: 'delivery',
      driver: {
        id: driver?.id,
        nombre: driver?.name,
        avatar: driver?.avatar,
      },
      ratedId: driver?.id,
    });
  };

  // Procesar pago con MercadoPago y abrir checkout
  const processMercadoPagoPayment = async () => {
    try {
      const amount = delivery?.estimatedPrice || 0;

      const result = await paymentService.processPayment({
        deliveryId: delivery.id,
        amount,
        paymentMethod: 'mercadopago',
      });

      if (result.success && (result.initPoint || result.sandboxInitPoint)) {
        const checkoutUrl = result.initPoint || result.sandboxInitPoint;
        // Si tiene la app de MercadoPago instalada, abrir ahí
        const canOpenMP = await Linking.canOpenURL('mercadopago://');
        if (canOpenMP) {
          await Linking.openURL(checkoutUrl);
        } else {
          await WebBrowser.openBrowserAsync(checkoutUrl, {
            createTask: false,
            enableBarCollapsing: true,
          });
        }
      }
    } catch (error) {
      console.error('Error processing MercadoPago payment:', error);
      Alert.alert('Error', 'No se pudo procesar el pago con MercadoPago. Podrás pagarlo más tarde.');
    }
    // Ir al rating siempre (el pago se confirma via webhook)
    goToRating();
  };

  const handleCall = () => {
    // TODO: Implementar llamada al conductor
    Alert.alert('Llamar', `Llamando a ${driver?.name || 'conductor'}...`);
  };

  const handleChat = () => {
    navigation.navigate('Chat', {
      deliveryId: delivery?.id,
      otherUserName: driver?.name,
      otherUserAvatar: driver?.avatar,
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar envío',
      '¿Estás seguro de que deseas cancelar este envío?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            // Navegar a la pantalla de cancelación para seleccionar motivo
            navigation.navigate('CancelDelivery', {
              deliveryId: delivery?.id,
              isDelivery: true,
            });
          },
        },
      ]
    );
  };

  // Mostrar loading mientras carga
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text} />
        <Text style={styles.loadingText}>Cargando información del envío...</Text>
      </View>
    );
  }

  // Si no hay delivery después de cargar
  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.loadingText}>No se encontró el envío</Text>
        <TouchableOpacity
          style={styles.backButtonCenter}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonCenterText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapViewWrapper
          origin={origin}
          destination={destination}
          driverLocation={driverLocation}
          markers={additionalMarkers}
          showRoute={!!(origin && destination)}
          style={styles.map}
          edgePadding={{ top: 80, right: 50, bottom: 50, left: 50 }}
        />

        {/* Back Button */}
        <SafeAreaView style={styles.headerOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </SafeAreaView>

      </View>

      {/* Bottom Card */}
      <ServiceTrackingCard
        driver={{
          name: driver?.name,
          photo: driver?.avatar,
          rating: driver?.rating,
          vehicle: driver?.vehicle,
          vehicleColor: driver?.vehicleColor,
          plate: driver?.plate,
        }}
        originAddress={pickupAddress}
        destinationAddress={dropoffAddress}
        serviceName={serviceName}
        servicePrice={servicePrice}
        statusText={getStatusText()}
        isLive={!!driverLocation}
        onChat={handleChat}
        onCancel={handleCancel}
        showCancel={status !== 'delivered' && status !== 'cancelled'}
        cancelLabel="Cancelar envío"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.screenPadding,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  backButtonCenter: {
    marginTop: SIZES.lg,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xl,
    backgroundColor: COLORS.text,
    borderRadius: SIZES.radiusFull,
  },
  backButtonCenterText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: SIZES.screenPadding,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
});

export default DeliveryTrackingScreen;
