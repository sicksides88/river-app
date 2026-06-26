import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapViewWrapper } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ViajeAceptadoChoferScreen - Viaje aceptado con chofer basado en Figma
const ViajeAceptadoChoferScreen = ({ navigation, route }) => {
  const { origin, destination, driver, vehicle } = route.params || {};

  // Usar datos pasados por parámetros
  const vehicleInfo = vehicle || {
    plate: '---',
    model: 'Vehículo no disponible',
    image: null,
  };

  const driverInfo = driver || {
    name: 'Conductor',
    rating: 0,
    photo: null,
  };

  const originAddress = origin?.address || 'Independencia 156';
  const destinationAddress = destination?.address || 'Avenida Córdoba 1324';

  const handleDriverOptions = () => {
    // TODO: Show driver options (call, message, etc)
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

        {/* Vehicle Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehiclePlate}>{vehicleInfo.plate}</Text>
            <Text style={styles.vehicleModel}>{vehicleInfo.model}</Text>
          </View>
          {/* Vehicle Image Placeholder - ASSET NEEDED */}
          <View style={styles.vehicleImageContainer}>
            {vehicleInfo.image ? (
              <Image source={{ uri: vehicleInfo.image }} style={styles.vehicleImage} />
            ) : (
              <View style={styles.vehicleImagePlaceholder}>
                <Ionicons name="car-sport" size={48} color={COLORS.textMuted} />
              </View>
            )}
          </View>
        </View>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          {/* Driver Photo */}
          <View style={styles.driverPhotoContainer}>
            {driverInfo.photo ? (
              <Image source={{ uri: driverInfo.photo }} style={styles.driverPhoto} />
            ) : (
              <View style={styles.driverPhotoPlaceholder}>
                <Ionicons name="person" size={32} color={COLORS.textMuted} />
              </View>
            )}
          </View>

          {/* Driver Info */}
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverInfo.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.driverRating}>{driverInfo.rating}</Text>
              <Ionicons name="star" size={16} color="#F5A623" />
            </View>
          </View>

          {/* More Options */}
          <TouchableOpacity
            style={styles.driverOptionsButton}
            onPress={handleDriverOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Route Card */}
        <View style={styles.routeCard}>
          {/* Origin */}
          <View style={styles.routePoint}>
            <View style={styles.routeIconColumn}>
              <View style={styles.originDot} />
              <View style={styles.connectorLine} />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Punto de partida</Text>
              <Text style={styles.routeAddress}>{originAddress}</Text>
            </View>
          </View>

          {/* Destination */}
          <View style={styles.routePoint}>
            <View style={styles.routeIconColumn}>
              <View style={styles.destinationDot} />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeAddress}>{destinationAddress}</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: COLORS.text,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  etaNumber: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
  },
  etaUnit: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.white,
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

  // Vehicle Card
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.screenPadding,
    padding: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  vehicleModel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  vehicleImageContainer: {
    width: 120,
    height: 60,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  vehicleImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.screenPadding,
    padding: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.md,
  },
  driverPhotoContainer: {
    marginRight: SIZES.md,
  },
  driverPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  driverPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverRating: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  driverOptionsButton: {
    padding: SIZES.sm,
  },

  // Route Card
  routeCard: {
    marginHorizontal: SIZES.screenPadding,
    padding: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
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
    height: 24,
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
  routeTextContainer: {
    flex: 1,
    marginLeft: SIZES.sm,
    paddingBottom: SIZES.sm,
  },
  routeLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
});

export default ViajeAceptadoChoferScreen;
