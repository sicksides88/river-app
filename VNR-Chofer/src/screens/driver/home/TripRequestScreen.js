import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapViewWrapper } from '../../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { rideService, deliveryService } from '../../../services';

const TIMEOUT_SECONDS = 15; // Debe coincidir con ROUND_TIMEOUT_MS del backend

const TripRequestScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { trip } = route.params || {};
  const isDelivery = trip?.isDelivery || false;
  const isFlete = trip?.serviceType === 'flete' || trip?.serviceType === 'fletes' || trip?.type === 'Flete';
  const [timeLeft, setTimeLeft] = useState(trip?.timeoutSeconds || TIMEOUT_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  // Preparar datos de origen y destino para MapViewWrapper
  const originData = useMemo(() => {
    if (trip?.pickup?.lat && trip?.pickup?.lng) {
      return {
        lat: trip.pickup.lat,
        lng: trip.pickup.lng,
        title: 'Retiro',
        description: trip.pickup.address,
      };
    }
    return null;
  }, [trip]);

  const destinationData = useMemo(() => {
    if (trip?.dropoff?.lat && trip?.dropoff?.lng) {
      return {
        lat: trip.dropoff.lat,
        lng: trip.dropoff.lng,
        title: 'Entrega',
        description: trip.dropoff.address,
      };
    }
    return null;
  }, [trip]);

  // Iniciar countdown
  useEffect(() => {
    // Animar barra de progreso
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: (trip?.timeoutSeconds || TIMEOUT_SECONDS) * 1000,
      useNativeDriver: false,
    }).start();

    // Timer de countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleTimeout = async () => {
    // Auto-rechazar cuando el tiempo expira
    if (isDelivery && trip?.deliveryId) {
      // Para envíos, simplemente volvemos atrás (no hay reject en el backend por ahora)
      console.log('Timeout envío:', trip.deliveryId);
    } else if (trip?.rideId) {
      try {
        await rideService.rejectRide(trip.rideId);
      } catch (error) {
        console.error('Error auto-rejecting ride:', error);
      }
    }
    navigation.goBack();
  };

  const handleAccept = async () => {
    // Demo mode sin backend
    if (!trip?.rideId && !trip?.deliveryId) {
      navigation.replace('TripActive', { trip });
      return;
    }

    setIsLoading(true);
    try {
      if (isDelivery) {
        // Aceptar envío con el vehicleId del conductor
        const response = await deliveryService.acceptDelivery(trip.deliveryId, trip.vehicleId);
        if (response.success) {
          navigation.replace('TripActive', {
            trip: { ...trip, ...response.delivery },
            isDelivery: true
          });
        } else {
          Alert.alert('Error', response.message || 'No se pudo aceptar el envío');
          navigation.goBack();
        }
      } else {
        // Aceptar viaje
        const response = await rideService.acceptRide(trip.rideId);
        if (response.success) {
          navigation.replace('TripActive', { trip: response.ride });
        } else {
          Alert.alert('Error', response.message || 'No se pudo aceptar el viaje');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error accepting:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || (isDelivery ? 'El envío ya no está disponible' : 'El viaje ya no está disponible')
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isDelivery) {
      // Para envíos, simplemente volvemos atrás
      console.log('Rechazando envío:', trip?.deliveryId);
    } else if (trip?.rideId) {
      try {
        await rideService.rejectRide(trip.rideId);
      } catch (error) {
        console.error('Error rejecting ride:', error);
      }
    }
    navigation.goBack();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Mapa de fondo con ruta real usando Google Directions */}
      <MapViewWrapper
        origin={originData}
        destination={destinationData}
        showRoute={!!(originData && destinationData)}
        showsUserLocation={false}
        style={styles.map}
        edgePadding={{ top: 120, right: 60, bottom: 380, left: 60 }}
      />

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleReject}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* Timer badge */}
        <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerBadgeUrgent]}>
          <Ionicons name="time-outline" size={14} color={timeLeft <= 5 ? COLORS.white : COLORS.primary} />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </SafeAreaView>

      {/* Trip request card */}
      <View style={[styles.cardContainer, { paddingBottom: insets.bottom + 65 }]}>
        <View style={styles.card}>
          {/* Type badge and close */}
          <View style={styles.headerRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{trip?.type || 'Vuelta segura'}</Text>
            </View>
            <TouchableOpacity onPress={handleReject}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Text style={styles.price}>
            ${(trip?.estimatedPrice || trip?.price || 0).toLocaleString('es-AR')}
          </Text>

          {/* Rating - Solo para viajes (pasajeros), no para envíos */}
          {!isDelivery && (trip?.rating || trip?.user?.rating) && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={COLORS.text} />
              <Text style={styles.ratingText}>
                {trip?.rating || trip?.user?.rating}{trip?.reviews ? ` (${trip.reviews})` : ''}
              </Text>
            </View>
          )}

          {/* Package info for deliveries / Flete info */}
          {isDelivery && (trip?.packageDescription || trip?.packageWeight || trip?.packageDimensions || trip?.helpers > 0) && (
            <View style={[styles.packageInfoContainer, isFlete && styles.fleteInfoContainer]}>
              <View style={styles.packageInfo}>
                <Ionicons name={isFlete ? "car-outline" : "cube-outline"} size={16} color={COLORS.textSecondary} />
                <Text style={styles.packageText}>
                  {trip?.packageDescription || (isFlete ? 'Flete' : 'Paquete')}
                </Text>
              </View>
              <View style={styles.packageDetails}>
                {/* Mostrar dimensiones solo para envíos de paquetes, no fletes */}
                {!isFlete && trip?.packageDimensions && (
                  <View style={styles.packageDetailItem}>
                    <Text style={styles.packageDetailLabel}>Dimensiones:</Text>
                    <Text style={styles.packageDetailValue}>
                      {trip.packageDimensions.height} x {trip.packageDimensions.width} x {trip.packageDimensions.depth} cm
                    </Text>
                  </View>
                )}
                {!isFlete && trip?.packageWeight && (
                  <View style={styles.packageDetailItem}>
                    <Text style={styles.packageDetailLabel}>Peso:</Text>
                    <Text style={styles.packageDetailValue}>{trip.packageWeight} kg</Text>
                  </View>
                )}
                {/* Mostrar ayudantes para fletes */}
                {isFlete && (
                  <View style={styles.packageDetailItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.packageDetailLabel}>Ayudantes:</Text>
                    <Text style={styles.packageDetailValue}>
                      {trip?.helpers > 0 ? `${trip.helpers} persona(s)` : 'Sin ayudantes'}
                    </Text>
                  </View>
                )}
                {/* Tipo de vehículo para fletes */}
                {isFlete && trip?.vehicleType && (
                  <View style={styles.packageDetailItem}>
                    <Ionicons name="car-sport-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.packageDetailLabel}>Vehículo:</Text>
                    <Text style={styles.packageDetailValue}>{trip.vehicleType}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Locations */}
          <View style={styles.locations}>
            <View style={styles.locationRow}>
              <View style={[styles.originDot, isDelivery && styles.deliveryDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Retiro</Text>
                <Text style={styles.locationValue} numberOfLines={2}>
                  {trip?.pickup?.address || 'Dirección de retiro'}
                </Text>
              </View>
            </View>

            <View style={styles.locationLine} />

            <View style={styles.locationRow}>
              <View style={[styles.destinationDot, isDelivery && styles.deliveryDestDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Entrega</Text>
                <Text style={styles.locationValue} numberOfLines={2}>
                  {trip?.dropoff?.address || trip?.destination?.address || 'Dirección de entrega'}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Accept button */}
          <TouchableOpacity
            style={[styles.acceptButton, isLoading && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  timerBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    marginLeft: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerBadgeUrgent: {
    backgroundColor: '#FF3B30',
  },
  timerText: {
    color: COLORS.primary,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  typeBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  typeText: {
    color: COLORS.primary,
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  price: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    marginBottom: SIZES.lg,
  },
  ratingText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    marginLeft: 4,
    fontWeight: '500',
  },
  packageInfoContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  fleteInfoContainer: {
    backgroundColor: '#E3F2FD', // Azul claro para fletes
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  packageText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  packageDetails: {
    marginLeft: SIZES.lg + SIZES.xs,
  },
  packageDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  packageDetailLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginRight: SIZES.xs,
  },
  packageDetailValue: {
    fontSize: SIZES.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  deliveryDot: {
    borderColor: '#FF9500',
  },
  deliveryDestDot: {
    backgroundColor: '#FF9500',
  },
  locations: {
    marginBottom: SIZES.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: 'transparent',
    marginTop: 4,
    marginRight: SIZES.sm,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    marginRight: SIZES.sm,
  },
  locationLine: {
    width: 0,
    height: 20,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginLeft: 4,
    marginVertical: SIZES.xs,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 2,
    marginBottom: SIZES.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  acceptButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default TripRequestScreen;
