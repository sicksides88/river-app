import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { MapViewWrapper } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// EsperaScreen - Pantalla de búsqueda de conductor basado en Figma "Espera"
const EsperaScreen = ({ navigation, route }) => {
  const { origin, destination, service, price } = route.params || {};
  const [searching, setSearching] = useState(true);

  // Simular búsqueda de conductor
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navegar a ViajeAceptado cuando se encuentra conductor
      navigation.replace('ViajeAceptado', {
        origin,
        destination,
        service,
        price,
        driver: {
          name: 'Juan Pérez',
          rating: 4.8,
          vehicle: 'Toyota Corolla',
          plate: 'ABC 123',
          eta: 3,
        },
      });
    }, 5000); // Simular 5 segundos de búsqueda

    return () => clearTimeout(timer);
  }, []);

  const handleCancel = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {origin?.coordinates && destination?.coordinates ? (
          <MapViewWrapper
            origin={{
              lat: origin.coordinates.lat,
              lng: origin.coordinates.lng,
              title: 'Origen',
            }}
            destination={{
              lat: destination.coordinates.lat,
              lng: destination.coordinates.lng,
              title: 'Destino',
            }}
            showRoute
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

        {/* ETA Badge */}
        <View style={styles.etaBadge}>
          <Text style={styles.etaNumber}>2</Text>
          <Text style={styles.etaUnit}>MIN</Text>
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
          {/* Illustration Placeholder - ASSET NEEDED: searching-driver.png */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustration}>
              <Ionicons name="search" size={48} color={COLORS.primary} />
              <Ionicons
                name="car-sport"
                size={40}
                color={COLORS.error}
                style={styles.carIcon}
              />
            </View>
            {searching && (
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
                style={styles.loader}
              />
            )}
          </View>

          {/* Message */}
          <Text style={styles.message}>
            Estamos buscando al conductor ideal{'\n'}para usted
          </Text>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancelar Busqueda</Text>
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

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back Button
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: SIZES.screenPadding,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },

  // ETA Badge
  etaBadge: {
    position: 'absolute',
    top: '30%',
    right: '25%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  etaNumber: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  etaUnit: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Bottom Sheet
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

  // Content
  content: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.screenPadding,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  illustration: {
    width: 200,
    height: 150,
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
    bottom: -20,
  },

  // Message
  message: {
    fontSize: SIZES.body,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Cancel Button
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

export default EsperaScreen;
