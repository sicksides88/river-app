import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { MapViewWrapper } from '../../components/common';
import { ServiceTrackingCard } from '../../components/services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import * as WebBrowser from 'expo-web-browser';
import { useRideQueue, useDriverLocation } from '../../hooks';
import { rideService, paymentService } from '../../services';

// TripActiveScreen - "Viaje aceptado" basado en diseño Figma
// Shows map with driver approaching, driver info card, contact options
const TripActiveScreen = ({ navigation, route }) => {
  const { origin: originParam, destination: destParam, service, paymentMethod, carModel, rideId, trip: tripParam, driver: driverParam } = route.params || {};

  // Resolver origin/destination desde params directos o desde tripParam (banner)
  const origin = originParam || (tripParam?.pickup ? {
    address: tripParam.pickup.address,
    coordinates: { lat: tripParam.pickup.lat, lng: tripParam.pickup.lng },
  } : null);

  const destination = destParam || (tripParam?.dropoff ? {
    address: tripParam.dropoff.address,
    coordinates: { lat: tripParam.dropoff.lat, lng: tripParam.dropoff.lng },
  } : null);

  // Si viene del banner con datos del viaje activo, inicializar con estado correcto
  const hasActiveDriver = driverParam || ['accepted', 'in_progress', 'in-progress', 'arriving', 'arrived', 'driver-assigned', 'driver_assigned', 'driver-arrived', 'driver_arrived'].includes(tripParam?.status);
  // Normalizar status del backend al formato del frontend
  const normalizeStatus = (s) => {
    const map = { 'driver-assigned': 'accepted', 'driver_assigned': 'accepted', 'driver-arrived': 'arriving', 'driver_arrived': 'arriving', 'in-progress': 'in_progress', 'in_progress': 'in_progress', 'pending': 'searching', 'requested': 'searching', 'searching': 'searching' };
    return map[s] || s || 'accepted';
  };
  const initialStatus = hasActiveDriver ? normalizeStatus(tripParam?.status) : 'searching';
  const initialDriver = driverParam ? {
    id: driverParam.id,
    name: driverParam.name,
    rating: driverParam.rating || 4.5,
    trips: 0,
    vehicle: (typeof driverParam.vehicle === 'string')
      ? { model: driverParam.vehicle, color: driverParam.vehicleColor || '', plate: driverParam.plate || '' }
      : (driverParam.vehicle || { model: 'Vehículo', color: '', plate: '' }),
    photo: driverParam.avatar,
    eta: driverParam.eta || 5,
  } : null;

  const [tripStatus, setTripStatus] = useState(initialStatus);
  const [driver, setDriver] = useState(initialDriver);
  const [isCancelling, setIsCancelling] = useState(false);

  // Hook para escuchar eventos de la cola
  const {
    status: queueStatus,
    round,
    maxRounds,
    driversNotified,
    message: queueMessage,
    driver: queueDriver,
    vehicle: queueVehicle,
    isSearching,
    isAccepted,
    isArrived,
    isInProgress,
    isCompleted,
    isCancelled,
    noDrivers,
    error: queueError,
  } = useRideQueue(rideId);

  // Hook para tracking de ubicación del conductor en tiempo real
  const pickupCoords = useMemo(() => origin?.coordinates ? {
    latitude: origin.coordinates.lat || origin.coordinates.latitude,
    longitude: origin.coordinates.lng || origin.coordinates.longitude,
  } : null, [origin]);

  const {
    driverLocation,
    locationHistory,
    eta: driverEta,
    isLoading: isLoadingLocation,
    isConnected: isLocationConnected,
  } = useDriverLocation(driver?.id, rideId, pickupCoords);

  // Preparar marker del conductor para el mapa
  const driverMarker = useMemo(() => {
    if (!driverLocation || tripStatus === 'searching') return null;
    return {
      id: 'driver',
      coordinate: {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      },
      title: driver?.name || 'Conductor',
      description: `Llegando en ${driverEta?.durationText || `${driver?.eta || 5} min`}`,
      heading: driverLocation.heading || 0,
      isDriver: true,
    };
  }, [driverLocation, tripStatus, driver, driverEta]);

  // Actualizar estado basado en la cola
  useEffect(() => {
    if (isAccepted && queueDriver) {
      setTripStatus('accepted');
      setDriver({
        id: queueDriver.id,
        name: `${queueDriver.nombre || ''} ${queueDriver.apellido || ''}`.trim() || 'Conductor',
        rating: queueDriver.rating || 4.5,
        trips: 0,
        phone: queueDriver.telefono_numero,
        vehicle: queueVehicle ? {
          model: `${queueVehicle.brand || ''} ${queueVehicle.model || ''}`.trim() || 'Vehículo',
          color: queueVehicle.color || '',
          plate: queueVehicle.plate || '',
          year: queueVehicle.year,
        } : {
          model: 'Vehículo',
          color: '',
          plate: '',
        },
        photo: queueDriver.avatar,
        eta: queueDriver.eta || 5,
      });
    } else if (isArrived) {
      setTripStatus('arriving');
    } else if (isInProgress) {
      setTripStatus('in_progress');
    } else if (isCancelled) {
      Alert.alert(
        'Viaje cancelado',
        'El viaje fue cancelado.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else if (noDrivers) {
      Alert.alert(
        'Sin conductores disponibles',
        queueError || 'No encontramos conductores en tu zona. Intenta de nuevo en unos minutos.',
        [
          {
            text: 'Volver',
            onPress: () => navigation.navigate('VueltaSegura'),
          },
        ]
      );
    }
  }, [isAccepted, queueDriver, queueVehicle, isArrived, isInProgress, isCancelled, noDrivers, queueError]);

  // Navegar al rating (reutilizable)
  const goToRating = () => {
    navigation.replace('RateRide', {
      rideId,
      type: 'ride',
      driver: {
        id: driver.id,
        nombre: driver.name,
        avatar: driver.photo,
      },
      ratedId: driver.id,
    });
  };

  // Procesar pago con MercadoPago y abrir checkout
  const processMercadoPagoPayment = async () => {
    try {
      const rideData = await rideService.getRideById(rideId);
      const amount = rideData?.ride?.estimated_price || tripParam?.price || service?.price || 0;
      const driverId = rideData?.ride?.driver?.id || driver?.id;

      const result = await paymentService.processPayment({
        rideId,
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
          await WebBrowser.openBrowserAsync(checkoutUrl);
        }
      }
    } catch (error) {
      console.error('Error processing MercadoPago payment:', error);
      Alert.alert('Error', 'No se pudo procesar el pago con MercadoPago. Podrás pagarlo más tarde.');
    }
    // Ir al rating siempre (el pago se confirma via webhook)
    goToRating();
  };

  // Manejar viaje completado - navegar a pantalla de rating
  useEffect(() => {
    if (isCompleted && driver) {
      setTripStatus('completed');
      if (paymentMethod === 'mercadopago' || paymentMethod === 'card') {
        processMercadoPagoPayment();
      } else {
        goToRating();
      }
    }
  }, [isCompleted, driver, rideId, navigation]);

  // Consultar status actual del ride al montar (por si el evento socket se perdió)
  useEffect(() => {
    if (!rideId) return;
    const checkCurrentStatus = async () => {
      try {
        const response = await rideService.getRideById(rideId);
        if (response.success && response.ride) {
          const currentStatus = response.ride.status;
          if (currentStatus === 'completed') {
            const rideDriver = response.ride.driver || driver;
            if (rideDriver) {
              // Setear driver para que goToRating/processMercadoPagoPayment lo usen
              if (!driver) {
                setDriver({
                  id: rideDriver.id,
                  name: rideDriver.nombre || rideDriver.name,
                  photo: rideDriver.avatar,
                  rating: rideDriver.rating || 4.5,
                  trips: 0,
                  vehicle: { model: 'Vehículo', color: '', plate: '' },
                });
              }
              if (paymentMethod === 'mercadopago' || paymentMethod === 'card') {
                await processMercadoPagoPayment();
              } else {
                navigation.replace('RateRide', {
                  rideId,
                  type: 'ride',
                  driver: {
                    id: rideDriver.id,
                    nombre: rideDriver.nombre || rideDriver.name,
                    avatar: rideDriver.avatar || rideDriver.photo,
                  },
                  ratedId: rideDriver.id,
                });
              }
            }
          } else if (currentStatus === 'cancelled') {
            setTripStatus('cancelled');
            const reason = response.ride.cancellationReason || response.ride.cancellation_reason;
            if (reason === 'no_drivers_available') {
              Alert.alert(
                'Sin conductores disponibles',
                'No encontramos conductores en tu zona. Intenta de nuevo en unos minutos.',
                [{ text: 'Volver', onPress: () => navigation.navigate('VueltaSegura') }]
              );
            } else {
              Alert.alert(
                'Viaje cancelado',
                'El viaje fue cancelado.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }
          } else {
            const normalized = normalizeStatus(currentStatus);
            if (normalized !== tripStatus) {
              setTripStatus(normalized);
            }
          }
        }
      } catch (error) {
        console.error('Error checking ride status:', error);
      }
    };
    checkCurrentStatus();
  }, [rideId]);

  // Fallback: si no hay rideId, usar simulación para demo
  useEffect(() => {
    if (!rideId) {
      const timer = setTimeout(() => {
        setTripStatus('accepted');
        setDriver({
          name: 'Jorge Pérez',
          rating: 4.8,
          trips: 342,
          phone: '+54 11 1234-5678',
          vehicle: {
            model: 'Ford Fiesta',
            color: 'Gris',
            plate: 'AB 123 CD',
          },
          photo: null,
          eta: 5,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rideId]);

  const handleCall = () => {
    if (driver?.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    }
  };

  const handleMessage = () => {
    // Navegar al chat in-app
    const { rideId } = route.params || {};
    if (rideId && driver) {
      navigation.navigate('Chat', {
        rideId,
        otherUserName: driver.name,
        otherUserAvatar: driver.photo,
      });
    } else if (driver?.phone) {
      // Fallback a SMS si no hay rideId
      Linking.openURL(`sms:${driver.phone}`);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro que querés cancelar el viaje?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (rideId) {
              setIsCancelling(true);
              try {
                await rideService.cancelRide(rideId);
              } catch (error) {
                console.error('Error cancelling ride:', error);
              } finally {
                setIsCancelling(false);
              }
            }
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewWrapper
          origin={
            origin?.coordinates
              ? {
                  lat: origin.coordinates.lat || origin.coordinates.latitude,
                  lng: origin.coordinates.lng || origin.coordinates.longitude,
                  title: 'Tu ubicación',
                  description: origin.address,
                }
              : null
          }
          destination={
            destination?.coordinates
              ? {
                  lat: destination.coordinates.lat || destination.coordinates.latitude,
                  lng: destination.coordinates.lng || destination.coordinates.longitude,
                  title: 'Destino',
                  description: destination.address,
                }
              : null
          }
          markers={driverMarker ? [driverMarker] : []}
          driverLocation={driverLocation}
          driverHeading={driverLocation?.heading}
          showRoute={!!(origin?.coordinates && destination?.coordinates)}
          showsUserLocation
        />

        {/* Real-time ETA Badge */}
        {tripStatus !== 'searching' && driverLocation && (
          <View style={styles.etaBadge}>
            <View style={styles.etaLiveDot} />
            <Text style={styles.etaText}>
              {driverEta?.durationText || `${driver?.eta || 5} min`}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      {tripStatus === 'searching' && (
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
          <View style={styles.searchingContainer}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color={COLORS.text} />
            </View>
            <Text style={styles.searchingTitle}>
              {queueMessage || 'Buscando conductor...'}
            </Text>
            <Text style={styles.searchingSubtitle}>
              {isSearching && round > 0
                ? `Ronda ${round} de ${maxRounds} - ${driversNotified} conductores notificados`
                : 'Estamos asignándote el mejor conductor cercano'}
            </Text>

            {/* Progress indicator */}
            {isSearching && round > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressDots}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.progressDot,
                        i <= round && styles.progressDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Cancel button during search */}
            <TouchableOpacity
              style={styles.cancelSearchButton}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <Text style={styles.cancelSearchButtonText}>Cancelar búsqueda</Text>
              )}
            </TouchableOpacity>
          </View>
      </View>
      )}

        {/* Driver Accepted State */}
        {tripStatus !== 'searching' && driver && (
          <ServiceTrackingCard
            driver={{
              name: driver.name,
              photo: driver.photo,
              rating: driver.rating,
              vehicle: driver.vehicle?.model ? `${driver.vehicle.model}` : driver.vehicle,
              vehicleColor: driver.vehicle?.color,
              plate: driver.vehicle?.plate,
            }}
            originAddress={origin?.address || 'Tu ubicación'}
            destinationAddress={destination?.address || 'Destino'}
            serviceName={service?.name || 'Vuelta Segura'}
            servicePrice={service?.price || tripParam?.price}
            statusText={
              tripStatus === 'arriving' ? 'El conductor llegó' :
              tripStatus === 'in_progress' ? 'Viaje en curso' :
              `Llegando en ${driverEta?.durationText || `${driver.eta} minutos`}`
            }
            isLive={!!(isLocationConnected && driverLocation)}
            onChat={handleMessage}
            onCancel={handleCancel}
            showCancel={true}
            cancelLabel="Cancelar viaje"
          />
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: SIZES.screenPadding,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.md,
  },
  mapContainer: {
    height: '55%',
    backgroundColor: COLORS.backgroundTertiary,
  },
  etaBadge: {
    position: 'absolute',
    top: 70,
    right: SIZES.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    ...SHADOWS.md,
  },
  etaLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: SIZES.xs,
  },
  etaText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    marginTop: -SIZES.lg,
    paddingTop: SIZES.xs,
    ...SHADOWS.lg,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SIZES.sm,
  },

  // Searching State
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  searchingTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  searchingSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: SIZES.lg,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.white,
  },
  cancelSearchButton: {
    marginTop: SIZES.xl,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  cancelSearchButtonText: {
    fontSize: SIZES.body,
    color: COLORS.error,
    fontWeight: '600',
  },

});

export default TripActiveScreen;
