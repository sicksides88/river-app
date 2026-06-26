import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationInput } from '../../components/common';
import { locationService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// RecibirArticuloScreen - "Indicá el orígen del envío" basado en Figma
const RecibirArticuloScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState({ address: 'Independencia 156', coordinates: null });
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Cargar direcciones recientes al montar
  useEffect(() => {
    loadRecentAddresses();
  }, []);

  const loadRecentAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const locations = await locationService.getRecentLocations(6);
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

  const handleAddressSelect = (item) => {
    const address = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
    setOrigin({ address, coordinates: item.coordinates || null });
  };

  const handleContinue = () => {
    if (origin) {
      navigation.navigate('EnviosDimensiones', {
        origin,
        destination,
        type: 'recibir',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.title}>Indicá el orígen del envío</Text>

        {/* Time Dropdown */}
        <TouchableOpacity style={styles.timeDropdown} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={18} color={COLORS.text} />
          <Text style={styles.timeDropdownText}>Iniciar envío</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.text} />
        </TouchableOpacity>

        {/* Location Card */}
        <View style={styles.locationCardContainer}>
          <View style={styles.locationCard}>
            {/* Origin Row */}
            <View style={styles.locationRow}>
              <View style={styles.locationIconColumn}>
                <View style={styles.originDot} />
                <View style={styles.connectorLine} />
              </View>
              <View style={styles.locationInputWrapper}>
                <LocationInput
                  placeholder="¿De dónde viene?"
                  value={origin}
                  onLocationSelect={setOrigin}
                  containerStyle={styles.locationInput}
                />
              </View>
            </View>

            {/* Destination Row */}
            <View style={styles.locationRow}>
              <View style={styles.locationIconColumn}>
                <View style={styles.destinationDot} />
              </View>
              <View style={styles.locationInputWrapper}>
                <Text style={styles.locationText}>{destination?.address || 'Destino'}</Text>
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
                onPress={() => handleAddressSelect(item)}
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
      </ScrollView>

      {/* Bottom Button */}
      {origin && (
        <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },

  // Title
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.xl,
    marginBottom: SIZES.lg,
  },

  // Time Dropdown
  timeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    alignSelf: 'flex-start',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  timeDropdownText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Location Card
  locationCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
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
    justifyContent: 'center',
    minHeight: 44,
  },
  locationText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationInput: {
    marginBottom: 0,
  },

  // Recent Addresses
  recentSection: {
    marginTop: SIZES.sm,
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default RecibirArticuloScreen;
