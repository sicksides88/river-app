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
import { deliveryService, locationService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// FletesScreen - "Planificar flete" basado en diseño de VueltaSegura
const FletesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [pickup, setPickup] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // State específico para fletes
  const [fleteTime, setFleteTime] = useState('Iniciar flete');
  const [vehicleType, setVehicleType] = useState('camioneta');
  const [helpers, setHelpers] = useState(0);
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Tipos de vehículo
  const vehicleTypes = [
    { id: 'utilitario', label: 'Utilitario', description: 'Hasta 500 kg', icon: 'car-outline', multiplier: 1 },
    { id: 'camioneta', label: 'Camioneta', description: 'Hasta 1000 kg', icon: 'car-sport-outline', multiplier: 1.5 },
    { id: 'camion-s', label: 'Camión S', description: 'Hasta 2000 kg', icon: 'bus-outline', multiplier: 2 },
    { id: 'camion-l', label: 'Camión L', description: 'Hasta 5000 kg', icon: 'bus', multiplier: 3 },
  ];

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
        title: loc.address?.split(',')[0] || loc.address,
        subtitle: loc.address?.split(',').slice(1).join(',').trim() || '',
        coordinates: loc.coordinates,
      }));
      setRecentAddresses(formatted);
    } catch (error) {
      console.error('Error loading recent addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Calculate estimate when both locations are set
  useEffect(() => {
    if (pickup?.coordinates && delivery?.coordinates) {
      calculateEstimate();
    } else {
      setEstimatedPrice(null);
      setEstimatedDuration(null);
      setDistance(null);
      setRoutePolyline(null);
    }
  }, [pickup, delivery, vehicleType, helpers]);

  const calculateEstimate = async () => {
    if (!pickup?.coordinates || !delivery?.coordinates) return;

    setIsCalculating(true);
    try {
      const dist = locationService.calculateDistance(
        pickup.coordinates.lat || pickup.coordinates.latitude,
        pickup.coordinates.lng || pickup.coordinates.longitude,
        delivery.coordinates.lat || delivery.coordinates.latitude,
        delivery.coordinates.lng || delivery.coordinates.longitude
      );

      setDistance(dist.toFixed(1));

      // Calcular precio con multiplicador de vehículo
      const selectedVehicle = vehicleTypes.find(v => v.id === vehicleType);
      const basePrice = deliveryService.calculateFleteEstimate(dist, 1000);
      let finalPrice = Math.round(basePrice * (selectedVehicle?.multiplier || 1));

      // Agregar costo por ayudante
      finalPrice += helpers * 2500;

      setEstimatedPrice(finalPrice);
      setEstimatedDuration(Math.round(dist * 5)); // ~5 min por km para fletes
    } catch (error) {
      console.error('Error calculating estimate:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirm = () => {
    if (!pickup?.coordinates || !delivery?.coordinates) {
      Alert.alert('Error', 'Por favor selecciona las direcciones de retiro y entrega');
      return;
    }

    navigation.navigate('DeliveryConfirm', {
      pickup: {
        address: pickup.address,
        coordinates: pickup.coordinates,
      },
      delivery: {
        address: delivery.address,
        coordinates: delivery.coordinates,
      },
      vehicleType,
      helpers,
      price: estimatedPrice,
      distance,
      duration: estimatedDuration,
      type: 'flete',
    });
  };

  const handleRecentAddressPress = (item) => {
    const address = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
    const locationData = {
      address,
      coordinates: item.coordinates || null,
    };

    if (!pickup) {
      setPickup(locationData);
    } else if (!delivery) {
      setDelivery(locationData);
    } else {
      setDelivery(locationData);
    }
  };

  const incrementHelpers = () => {
    if (helpers < 4) setHelpers(helpers + 1);
  };

  const decrementHelpers = () => {
    if (helpers > 0) setHelpers(helpers - 1);
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
          <Text style={styles.headerTitle}>Planificar flete</Text>

          {/* Time Selector Dropdown */}
          <TouchableOpacity style={styles.timeDropdown} activeOpacity={0.7}>
            <View style={styles.timeDropdownLeft}>
              <Ionicons name="time-outline" size={18} color={COLORS.text} />
              <Text style={styles.dropdownText}>{fleteTime}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.text} />
          </TouchableOpacity>

          {/* Location Card */}
          <View style={styles.locationCardContainer}>
            <View style={styles.locationCard}>
              {/* Pickup Row */}
              <View style={styles.locationRow}>
                <View style={styles.locationIconColumn}>
                  <View style={styles.originDot} />
                  <View style={styles.connectorLine} />
                </View>
                <View style={styles.locationInputWrapper}>
                  <LocationInput
                    placeholder="¿De dónde retiramos?"
                    value={pickup}
                    onLocationSelect={setPickup}
                    showCurrentLocation
                    containerStyle={styles.locationInput}
                  />
                </View>
              </View>

              {/* Delivery Row */}
              <View style={styles.locationRow}>
                <View style={styles.locationIconColumn}>
                  <View style={styles.destinationDot} />
                </View>
                <View style={styles.locationInputWrapper}>
                  <LocationInput
                    placeholder="¿A dónde lo llevamos?"
                    value={delivery}
                    onLocationSelect={setDelivery}
                    showCurrentLocation={false}
                    containerStyle={styles.locationInput}
                  />
                </View>
              </View>
            </View>

          </View>

          {/* Vehicle Type Selector */}
          <View style={styles.vehicleContainer}>
            <View style={styles.vehicleLabel}>
              <Ionicons name="car-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.vehicleLabelText}>Tipo de vehículo</Text>
            </View>

            <View style={styles.vehicleTabs}>
              {vehicleTypes.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.vehicleTab,
                    vehicleType === option.id && styles.vehicleTabActive,
                  ]}
                  onPress={() => setVehicleType(option.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={vehicleType === option.id ? COLORS.text : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.vehicleTabText,
                      vehicleType === option.id && styles.vehicleTabTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.vehicleTabDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Helpers Selector */}
          <View style={styles.helpersContainer}>
            <View style={styles.helpersLabel}>
              <Ionicons name="people-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.helpersLabelText}>Ayudantes</Text>
              <Text style={styles.helpersPrice}>$2,500 c/u</Text>
            </View>

            <View style={styles.helpersSelector}>
              <TouchableOpacity
                style={[styles.helpersButton, helpers === 0 && styles.helpersButtonDisabled]}
                onPress={decrementHelpers}
                activeOpacity={0.7}
                disabled={helpers === 0}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={helpers === 0 ? COLORS.textMuted : COLORS.text}
                />
              </TouchableOpacity>

              <Text style={styles.helpersCount}>{helpers}</Text>

              <TouchableOpacity
                style={[styles.helpersButton, helpers === 4 && styles.helpersButtonDisabled]}
                onPress={incrementHelpers}
                activeOpacity={0.7}
                disabled={helpers === 4}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={helpers === 4 ? COLORS.textMuted : COLORS.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Addresses */}
          <View style={styles.recentSection}>
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
                  <Ionicons name="time-outline" size={20} color={COLORS.textMuted} style={styles.recentIcon} />
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.recentSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Map Preview */}
          {pickup?.coordinates && delivery?.coordinates && (
            <View style={styles.mapPreview}>
              {isCalculating ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color={COLORS.text} />
                  <Text style={styles.mapLoadingText}>Calculando ruta...</Text>
                </View>
              ) : (
                <MapViewWrapper
                  origin={{
                    lat: pickup.coordinates.lat || pickup.coordinates.latitude,
                    lng: pickup.coordinates.lng || pickup.coordinates.longitude,
                    title: 'Retiro',
                    description: pickup.address,
                  }}
                  destination={{
                    lat: delivery.coordinates.lat || delivery.coordinates.latitude,
                    lng: delivery.coordinates.lng || delivery.coordinates.longitude,
                    title: 'Entrega',
                    description: delivery.address,
                  }}
                  routeCoordinates={routePolyline}
                  showRoute
                  style={styles.map}
                />
              )}
            </View>
          )}

          {/* Estimate Info */}
          {estimatedPrice && (
            <View style={styles.estimateContainer}>
              <View style={styles.estimateItem}>
                <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.estimateText}>{estimatedDuration} min</Text>
              </View>
              <View style={styles.estimateDot} />
              <View style={styles.estimateItem}>
                <Ionicons name="navigate-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.estimateText}>{distance} km</Text>
              </View>
              <View style={styles.estimateDot} />
              <View style={styles.estimateItem}>
                <Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.estimateText}>${estimatedPrice.toLocaleString('es-AR')}</Text>
              </View>
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.infoText}>Seguro de carga incluido</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="person-circle" size={16} color={COLORS.success} />
              <Text style={styles.infoText}>Conductor experimentado</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
          <Button
            title="Continuar"
            onPress={handleConfirm}
            loading={loading}
            disabled={!pickup?.coordinates || !delivery?.coordinates}
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

  // Time Dropdown
  timeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    alignSelf: 'flex-start',
  },
  timeDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  dropdownText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Location Card Container
  locationCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  locationCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
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
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: 'transparent',
  },
  connectorLine: {
    width: 0,
    height: 30,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginVertical: 4,
    marginLeft: 5,
  },
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

  // Vehicle Selector
  vehicleContainer: {
    marginBottom: SIZES.lg,
  },
  vehicleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  vehicleLabelText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  vehicleTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    padding: 4,
    gap: 4,
  },
  vehicleTab: {
    flex: 1,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xs,
    alignItems: 'center',
    borderRadius: SIZES.radiusLg - 4,
  },
  vehicleTabActive: {
    backgroundColor: COLORS.white,
  },
  vehicleTabText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  vehicleTabTextActive: {
    color: COLORS.text,
  },
  vehicleTabDescription: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // Helpers Selector
  helpersContainer: {
    marginBottom: SIZES.lg,
  },
  helpersLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  helpersLabelText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  helpersPrice: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  helpersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.sm,
  },
  helpersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.lg,
  },
  helpersButtonDisabled: {
    opacity: 0.4,
  },
  helpersCount: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },

  // Recent Addresses
  recentSection: {
    marginTop: SIZES.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recentIcon: {
    marginRight: SIZES.md,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
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
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundInput,
  },
  mapLoadingText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },

  // Estimate
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    flexWrap: 'wrap',
  },
  estimateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  estimateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: SIZES.md,
  },
  estimateText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },

  // Info Section
  infoSection: {
    marginBottom: SIZES.md,
    gap: SIZES.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  infoText: {
    fontSize: SIZES.small,
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

export default FletesScreen;
