import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, LocationInput, MapViewWrapper } from '../../components/common';
import { rideService, locationService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ChoferScreen - "Planificar servicio de chofer" basado en diseño Figma
// Similar to VueltaSegura but for hiring a driver for your own car
const ChoferScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { useCurrentLocation } = route.params || {};
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for service options
  const [serviceTime, setServiceTime] = useState('Ahora');
  const [serviceType, setServiceType] = useState('single'); // 'single' | 'round' | 'hourly'
  const [hours, setHours] = useState(2);

  // Service types
  const serviceTypes = [
    { id: 'single', name: 'Solo ida', description: 'Te llevamos a tu destino' },
    { id: 'round', name: 'Ida y vuelta', description: 'Te esperamos y regresamos' },
    { id: 'hourly', name: 'Por horas', description: 'Chofer a disposición' },
  ];

  const [recentAddresses, setRecentAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Obtener ubicación actual si viene del home
  useEffect(() => {
    if (useCurrentLocation) {
      (async () => {
        try {
          const location = await locationService.getCurrentLocation();
          const address = await locationService.getAddressFromCoords(
            location.latitude,
            location.longitude
          );
          setOrigin({
            address: address?.formatted || 'Mi ubicación',
            coordinates: { lat: location.latitude, lng: location.longitude },
          });
        } catch (error) {
          console.log('Error obteniendo ubicación actual:', error);
        }
      })();
    }
  }, []);

  // Cargar direcciones recientes al montar
  useEffect(() => {
    loadRecentAddresses();
  }, []);

  const loadRecentAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const locations = await locationService.getRecentLocations(5);
      const formatted = locations.map((loc) => ({
        id: loc.id,
        address: loc.address,
        coordinates: loc.coordinates,
      }));
      setRecentAddresses(formatted);
    } catch (error) {
      console.error('Error loading recent addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Calculate estimate when locations are set
  useEffect(() => {
    if (serviceType === 'hourly') {
      // For hourly service, calculate based on hours
      setEstimatedPrice(hours * 5000);
      setEstimatedDuration(hours * 60);
      setDistance(null);
    } else if (serviceType === 'single' && destination?.coordinates) {
      // Solo ida: estimar basado en destino (precio base sin distancia exacta de origen)
      if (origin?.coordinates) {
        calculateEstimate();
      } else {
        // Sin origen definido, usar precio base
        setEstimatedPrice(rideService.calculateEstimate(5));
        setEstimatedDuration(null);
        setDistance(null);
      }
    } else if (serviceType === 'round' && origin?.coordinates && destination?.coordinates) {
      calculateEstimate();
    } else {
      setEstimatedPrice(null);
      setEstimatedDuration(null);
      setDistance(null);
    }
  }, [origin, destination, serviceType, hours]);

  const calculateEstimate = () => {
    if (!origin?.coordinates || !destination?.coordinates) return;

    const dist = locationService.calculateDistance(
      origin.coordinates.lat,
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );

    setDistance(dist);
    let price = rideService.calculateEstimate(dist);
    const duration = rideService.calculateDuration(dist);

    // Adjust price based on service type
    if (serviceType === 'round') {
      price = price * 1.8; // 80% more for round trip
    }

    setEstimatedPrice(Math.round(price));
    setEstimatedDuration(duration);
  };

  const handleConfirm = async () => {
    if (serviceType === 'round' && (!origin?.coordinates || !destination?.coordinates)) {
      Alert.alert('Error', 'Por favor selecciona origen y destino');
      return;
    }
    if (serviceType === 'single' && !destination?.coordinates) {
      Alert.alert('Error', 'Por favor selecciona un destino');
      return;
    }

    // Si no hay origen, obtener ubicación actual
    let pickupOrigin = origin;
    if (!pickupOrigin?.coordinates) {
      try {
        const location = await locationService.getCurrentLocation();
        const address = await locationService.getAddressFromCoords(
          location.latitude,
          location.longitude
        );
        pickupOrigin = {
          address: address?.formatted || 'Mi ubicación',
          coordinates: { lat: location.latitude, lng: location.longitude },
        };
      } catch (error) {
        Alert.alert('Error', 'No pudimos obtener tu ubicación actual. Por favor habilita el GPS.');
        return;
      }
    }

    navigation.navigate('SelectService', {
      origin: {
        address: pickupOrigin.address,
        coordinates: pickupOrigin.coordinates,
      },
      destination: destination ? {
        address: destination.address,
        coordinates: destination.coordinates,
      } : null,
      price: estimatedPrice,
      duration: estimatedDuration,
      distance,
      serviceType,
      hours: serviceType === 'hourly' ? hours : null,
      isChofer: true,
    });
  };

  const handleRecentAddressPress = (item) => {
    const locationData = {
      address: item.address,
      coordinates: item.coordinates || null,
    };

    if (serviceType === 'single') {
      setDestination(locationData);
    } else if (!origin) {
      setOrigin(locationData);
    } else {
      setDestination(locationData);
    }
  };

  const incrementHours = () => {
    if (hours < 12) setHours(hours + 1);
  };

  const decrementHours = () => {
    if (hours > 1) setHours(hours - 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <Text style={styles.headerTitle}>Solicitar chofer</Text>

          {/* Time Selector Dropdown */}
          <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
            <Text style={styles.dropdownText}>{serviceTime}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.text} />
          </TouchableOpacity>

          {/* Service Type Selector */}
          <View style={styles.serviceTypeSection}>
            <Text style={styles.sectionTitle}>Tipo de servicio</Text>

            {serviceTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.serviceTypeCard,
                  serviceType === type.id && styles.serviceTypeCardSelected,
                ]}
                onPress={() => {
                  setServiceType(type.id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.serviceTypeRadio}>
                  {serviceType === type.id && <View style={styles.serviceTypeRadioInner} />}
                </View>
                <View style={styles.serviceTypeInfo}>
                  <Text style={styles.serviceTypeName}>{type.name}</Text>
                  <Text style={styles.serviceTypeDescription}>{type.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hours Selector (for hourly service) */}
          {serviceType === 'hourly' && (
            <View style={styles.hoursSection}>
              <View style={styles.hoursTitleRow}>
                <Text style={styles.sectionTitle}>Cantidad de horas</Text>
                <Text style={styles.hoursPrice}>$5,000/hora</Text>
              </View>

              <View style={styles.hoursSelector}>
                <TouchableOpacity
                  style={[styles.hoursButton, hours === 1 && styles.hoursButtonDisabled]}
                  onPress={decrementHours}
                  activeOpacity={0.7}
                  disabled={hours === 1}
                >
                  <Ionicons
                    name="remove"
                    size={24}
                    color={hours === 1 ? COLORS.textMuted : COLORS.text}
                  />
                </TouchableOpacity>

                <Text style={styles.hoursCount}>{hours}h</Text>

                <TouchableOpacity
                  style={[styles.hoursButton, hours === 12 && styles.hoursButtonDisabled]}
                  onPress={incrementHours}
                  activeOpacity={0.7}
                  disabled={hours === 12}
                >
                  <Ionicons
                    name="add"
                    size={24}
                    color={hours === 12 ? COLORS.textMuted : COLORS.text}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Location Card (not for hourly) */}
          {serviceType !== 'hourly' && (
            <View style={styles.locationCard}>
              {/* Origin Row - solo para ida y vuelta */}
              {serviceType === 'round' && (
                <View style={styles.locationRow}>
                  <View style={styles.locationIconColumn}>
                    <View style={styles.originDot} />
                    <View style={styles.connectorLine} />
                  </View>
                  <View style={styles.locationInputWrapper}>
                    <LocationInput
                      placeholder="¿Dónde te recogemos?"
                      value={origin}
                      onLocationSelect={setOrigin}
                      showCurrentLocation
                      containerStyle={styles.locationInput}
                    />
                  </View>
                </View>
              )}

              {/* Destination Row */}
              <View style={styles.locationRow}>
                <View style={styles.locationIconColumn}>
                  <View style={serviceType === 'single' ? styles.originDot : styles.destinationDot} />
                </View>
                <View style={styles.locationInputWrapper}>
                  <LocationInput
                    placeholder={serviceType === 'single' ? '¿A dónde te llevamos?' : '¿A dónde vas?'}
                    value={destination}
                    onLocationSelect={setDestination}
                    showCurrentLocation={serviceType === 'single'}
                    containerStyle={styles.locationInput}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Recent Addresses */}
          {serviceType !== 'hourly' && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Destinos frecuentes</Text>

              {loadingAddresses ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.textMuted} />
                  <Text style={styles.loadingText}>Cargando historial...</Text>
                </View>
              ) : recentAddresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay direcciones recientes</Text>
                </View>
              ) : (
                recentAddresses.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recentItem}
                    onPress={() => handleRecentAddressPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentIconContainer}>
                      <Ionicons name="location-outline" size={20} color={COLORS.textMuted} />
                    </View>
                    <Text style={styles.recentAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Map Preview */}
          {((serviceType === 'single' && destination?.coordinates) ||
            (serviceType === 'round' && origin?.coordinates && destination?.coordinates)) && (
            <View style={styles.mapPreview}>
              <MapViewWrapper
                origin={origin?.coordinates ? {
                  lat: origin.coordinates.lat,
                  lng: origin.coordinates.lng,
                  title: 'Origen',
                  description: origin.address,
                } : null}
                destination={{
                  lat: destination.coordinates.lat,
                  lng: destination.coordinates.lng,
                  title: 'Destino',
                  description: destination.address,
                }}
                showRoute={!!(origin?.coordinates && destination?.coordinates)}
                style={styles.map}
              />
            </View>
          )}

          {/* Estimate Info */}
          {estimatedPrice && (
            <View style={styles.estimateContainer}>
              <View style={styles.estimateItem}>
                <Text style={styles.estimateLabel}>Precio estimado</Text>
                <Text style={styles.estimatePrice}>
                  ${estimatedPrice.toLocaleString('es-AR')}
                </Text>
              </View>
              {distance && (
                <>
                  <View style={styles.estimateDot} />
                  <View style={styles.estimateItem}>
                    <Text style={styles.estimateLabel}>Distancia</Text>
                    <Text style={styles.estimateValue}>{distance} km</Text>
                  </View>
                </>
              )}
              {serviceType === 'hourly' && (
                <>
                  <View style={styles.estimateDot} />
                  <View style={styles.estimateItem}>
                    <Text style={styles.estimateLabel}>Duración</Text>
                    <Text style={styles.estimateValue}>{hours}h</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.infoText}>Chofer profesional verificado</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.infoText}>Seguro incluido</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.infoText}>Pago al finalizar</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
          <Button
            title="Continuar"
            onPress={handleConfirm}
            loading={loading}
            disabled={
              serviceType === 'hourly' ? false :
              serviceType === 'single' ? !destination?.coordinates :
              (!origin?.coordinates || !destination?.coordinates)
            }
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },

  // Header
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.lg,
    marginBottom: SIZES.lg,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  dropdownText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Section Title
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },

  // Service Type
  serviceTypeSection: {
    marginBottom: SIZES.lg,
  },
  serviceTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  serviceTypeCardSelected: {
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  serviceTypeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  serviceTypeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.black,
  },
  serviceTypeInfo: {
    flex: 1,
  },
  serviceTypeName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  serviceTypeDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },

  // Hours Selector
  hoursSection: {
    marginBottom: SIZES.lg,
  },
  hoursTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  hoursPrice: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  hoursSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SIZES.sm,
  },
  hoursButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.lg,
  },
  hoursButtonDisabled: {
    opacity: 0.5,
  },
  hoursCount: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 60,
    textAlign: 'center',
  },

  // Location Card
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: 14,
  },
  // Origen: círculo VACÍO (outline) como en Figma
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: 'transparent',
  },
  // Línea punteada como en Figma
  connectorLine: {
    width: 0,
    height: 30,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginVertical: 4,
    marginLeft: 5,
  },
  // Destino: círculo RELLENO negro como en Figma
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  locationInputWrapper: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  locationInput: {
    marginBottom: SIZES.xs,
  },

  // Recent Addresses
  recentSection: {
    marginBottom: SIZES.lg,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  recentAddress: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg,
    gap: SIZES.sm,
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    paddingVertical: SIZES.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },

  // Map Preview
  mapPreview: {
    height: 180,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.md,
  },
  map: {
    flex: 1,
  },

  // Estimate
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.lg,
    marginBottom: SIZES.md,
  },
  estimateItem: {
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
  },
  estimateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  estimateLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  estimatePrice: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  estimateValue: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Info Section
  infoSection: {
    marginBottom: SIZES.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  infoText: {
    marginLeft: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },

  // Bottom
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});

export default ChoferScreen;
