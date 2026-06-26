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

// EnviosScreen - "Planificar envío" basado en diseño de VueltaSegura
const EnviosScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [pickup, setPickup] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // State específico para envíos
  const [deliveryTime, setDeliveryTime] = useState('Iniciar envío');
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

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
  }, [pickup, delivery]);

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

      const price = await deliveryService.getEstimate('envio', dist);
      setEstimatedPrice(price);
      setEstimatedDuration(Math.round(dist * 4)); // ~4 min por km para envíos
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

    // Navegar a EnviosDimensiones para que el usuario ingrese las dimensiones del paquete
    navigation.navigate('EnviosDimensiones', {
      origin: {
        address: pickup.address,
        coordinates: pickup.coordinates,
      },
      destination: {
        address: delivery.address,
        coordinates: delivery.coordinates,
      },
      price: estimatedPrice,
      distance,
      duration: estimatedDuration,
      type: 'envio',
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
      // Si ambos están llenos, reemplazar el destino
      setDelivery(locationData);
    }
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
          <Text style={styles.headerTitle}>Planificar envío</Text>

          {/* Time Selector Dropdown */}
          <TouchableOpacity style={styles.timeDropdown} activeOpacity={0.7}>
            <View style={styles.timeDropdownLeft}>
              <Ionicons name="time-outline" size={18} color={COLORS.text} />
              <Text style={styles.dropdownText}>{deliveryTime}</Text>
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
                    placeholder="¿Dónde retiramos?"
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
                  <Ionicons name="time-outline" size={20} color={'rgba(255,255,255,0.7)'} style={styles.recentIcon} />
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

          {/* Map Preview - only show when both locations are selected */}
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
                <Ionicons name="time-outline" size={18} color={'rgba(255,255,255,0.7)'} />
                <Text style={styles.estimateText}>{estimatedDuration} min</Text>
              </View>
              <View style={styles.estimateDot} />
              <View style={styles.estimateItem}>
                <Ionicons name="navigate-outline" size={18} color={'rgba(255,255,255,0.7)'} />
                <Text style={styles.estimateText}>{distance} km</Text>
              </View>
              <View style={styles.estimateDot} />
              <View style={styles.estimateItem}>
                <Ionicons name="cash-outline" size={18} color={'rgba(255,255,255,0.7)'} />
                <Text style={styles.estimateText}>${estimatedPrice}</Text>
              </View>
            </View>
          )}
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
    paddingBottom: 190,
  },

  // Header
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
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
    color: COLORS.white,
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
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
    color: 'rgba(255,255,255,0.55)',
  },
  emptyContainer: {
    paddingVertical: SIZES.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.55)',
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
    color: 'rgba(255,255,255,0.72)',
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
    color: 'rgba(255,255,255,0.72)',
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

export default EnviosScreen;
