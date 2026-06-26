import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { MapViewWrapper } from '../../components/common';
import { useSocketContext } from '../../context/SocketContext';
import { deliveryService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// DeliverySearchingScreen - Pantalla de búsqueda de conductor para envío
const DeliverySearchingScreen = ({ navigation, route }) => {
  const { delivery, fromConfirm, paymentMethod } = route.params || {};
  const { socket, isConnected } = useSocketContext();
  const [searching, setSearching] = useState(true);
  const [searchTime, setSearchTime] = useState(0);
  // Solo validar si NO venimos directamente de la confirmación
  const [isValidating, setIsValidating] = useState(!fromConfirm);

  // Coordenadas para el mapa
  const origin = delivery?.pickup ? {
    lat: delivery.pickup.lat || delivery.pickup.coordinates?.lat,
    lng: delivery.pickup.lng || delivery.pickup.coordinates?.lng,
    title: 'Retiro',
  } : null;

  const destination = delivery?.dropoff ? {
    lat: delivery.dropoff.lat || delivery.dropoff.coordinates?.lat,
    lng: delivery.dropoff.lng || delivery.dropoff.coordinates?.lng,
    title: 'Entrega',
  } : null;

  // Validar que el envío existe en la base de datos al montar
  // Solo validar si NO venimos de la pantalla de confirmación (navegación directa)
  useEffect(() => {
    // Si venimos de confirmar, el envío acaba de crearse, no necesita validación
    if (fromConfirm) {
      setIsValidating(false);
      return;
    }

    const validateDelivery = async () => {
      if (!delivery?.id) {
        Alert.alert(
          'Error',
          'No se encontró información del envío.',
          [{
            text: 'OK',
            onPress: () => navigation.goBack(),
          }]
        );
        return;
      }

      try {
        const response = await deliveryService.getDeliveryById(delivery.id);
        if (!response.success || !response.delivery) {
          Alert.alert(
            'Envío no encontrado',
            'Este envío ya no existe o fue cancelado.',
            [{
              text: 'OK',
              onPress: () => navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              ),
            }]
          );
          return;
        }

        // Si el envío ya tiene conductor asignado, ir a tracking
        if (response.delivery.status !== 'pending' && response.delivery.driverInfo) {
          navigation.replace('DeliveryTracking', {
            delivery: {
              ...delivery,
              status: response.delivery.status,
            },
            driver: response.delivery.driverInfo,
            paymentMethod,
          });
          return;
        }

        // Si el envío está cancelado, volver al home
        if (response.delivery.status === 'cancelled') {
          Alert.alert(
            'Envío cancelado',
            'Este envío fue cancelado.',
            [{
              text: 'OK',
              onPress: () => navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              ),
            }]
          );
          return;
        }

        setIsValidating(false);
      } catch (error) {
        console.error('Error validating delivery:', error);

        // Si es un 404, el envío no existe
        if (error.response?.status === 404 || error.message?.includes('404')) {
          Alert.alert(
            'Envío no encontrado',
            'Este envío ya no existe o fue cancelado.',
            [{
              text: 'OK',
              onPress: () => navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              ),
            }]
          );
          return;
        }

        // Otro tipo de error
        Alert.alert(
          'Error',
          'No se pudo verificar el estado del envío.',
          [{
            text: 'OK',
            onPress: () => navigation.goBack(),
          }]
        );
      }
    };

    validateDelivery();
  }, [delivery?.id]);

  // Timer para mostrar tiempo de búsqueda
  useEffect(() => {
    if (isValidating) return; // No iniciar timer hasta validar

    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isValidating]);

  // Escuchar cuando un conductor acepta el envío
  useEffect(() => {
    if (!isConnected || !socket || !delivery?.id) return;

    const unsubAccepted = socket.on('delivery:accepted', (data) => {
      if (data.deliveryId === delivery.id) {
        setSearching(false);

        // Navegar a la pantalla de tracking
        navigation.replace('DeliveryTracking', {
          delivery: {
            ...delivery,
            status: 'confirmed',
          },
          driver: data.driver,
          paymentMethod,
        });
      }
    });

    const unsubStatusChanged = socket.on('delivery:status_changed', (data) => {
      if (data.deliveryId === delivery.id) {
        if (data.status === 'cancelled') {
          Alert.alert(
            'Envío cancelado',
            data.reason || 'El envío ha sido cancelado.',
            [{
              text: 'OK',
              onPress: () => navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              ),
            }]
          );
        }
      }
    });

    return () => {
      unsubAccepted();
      unsubStatusChanged();
    };
  }, [isConnected, socket, delivery?.id]);

  // Timeout de búsqueda (3 minutos)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searching) {
        Alert.alert(
          'Sin conductores disponibles',
          'No encontramos conductores disponibles en este momento. Por favor intenta más tarde.',
          [{
            text: 'OK',
            onPress: () => navigation.goBack(),
          }]
        );
      }
    }, 180000); // 3 minutos

    return () => clearTimeout(timeout);
  }, [searching]);

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar búsqueda',
      '¿Estás seguro de que deseas cancelar la búsqueda?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (delivery?.id) {
                await deliveryService.cancelDelivery(delivery.id);
              }
            } catch (error) {
              console.error('Error canceling delivery:', error);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mostrar loading mientras se valida
  if (isValidating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text} />
        <Text style={styles.loadingText}>Verificando envío...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {origin && destination ? (
          <MapViewWrapper
            origin={origin}
            destination={destination}
            showRoute
            style={styles.map}
            edgePadding={{ top: 80, right: 50, bottom: 50, left: 50 }}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={COLORS.textMuted} />
          </View>
        )}

        {/* Back Button */}
        <SafeAreaView style={styles.backButtonContainer} edges={['top', 'bottom']}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Search Time Badge */}
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={16} color={COLORS.white} />
          <Text style={styles.timeText}>{formatTime(searchTime)}</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Searching Content */}
        <View style={styles.content}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustration}>
              <Ionicons name="cube-outline" size={40} color={COLORS.primary} />
              <Ionicons
                name="car-sport"
                size={36}
                color={COLORS.text}
                style={styles.carIcon}
              />
            </View>
            {searching && (
              <ActivityIndicator
                size="large"
                color={COLORS.text}
                style={styles.loader}
              />
            )}
          </View>

          {/* Message */}
          <Text style={styles.message}>
            Estamos buscando al conductor ideal{'\n'}para tu envío
          </Text>

          {/* Delivery Info */}
          <View style={styles.deliveryInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#34C759" />
              <Text style={styles.infoText} numberOfLines={1}>
                {delivery?.pickup?.address || 'Punto de retiro'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#FF3B30" />
              <Text style={styles.infoText} numberOfLines={1}>
                {delivery?.dropoff?.address || 'Punto de entrega'}
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancelar búsqueda</Text>
        </TouchableOpacity>
      </View>
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
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonContainer: {
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
  timeBadge: {
    position: 'absolute',
    top: 60,
    left: SIZES.screenPadding + 54,
    backgroundColor: COLORS.text,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: SIZES.xxl,
    ...SHADOWS.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  content: {
    alignItems: 'center',
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.screenPadding,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  illustration: {
    width: 180,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    position: 'relative',
  },
  carIcon: {
    position: 'absolute',
    bottom: 20,
    right: 30,
  },
  loader: {
    position: 'absolute',
    bottom: -25,
  },
  message: {
    fontSize: SIZES.body,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  deliveryInfo: {
    width: '100%',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  cancelButton: {
    marginHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.error,
  },
});

export default DeliverySearchingScreen;
