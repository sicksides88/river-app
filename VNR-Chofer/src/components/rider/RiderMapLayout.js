import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RIDER_MAP_STYLE } from '../../constants/theme';
import { isValidLatLng } from '../../utils/mapCoordinates';
import RiderStatusPill from './RiderStatusPill';

const RiderMapLayout = ({
  region,
  onBack,
  statusLabel,
  statusTone,
  displayId,
  mapRef,
  marker,
  routeCoordinates,
  showAnchorOverlay,
  hideRoute,
  children,
  mapPlaceholder,
}) => {
  const safeRegion =
    region && isValidLatLng(region.latitude, region.longitude)
      ? region
      : { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.06, longitudeDelta: 0.06 };

  const safeMarker =
    marker && isValidLatLng(marker.latitude, marker.longitude)
      ? { latitude: Number(marker.latitude), longitude: Number(marker.longitude) }
      : null;

  const safeRoute =
    !hideRoute && Array.isArray(routeCoordinates)
      ? routeCoordinates.filter((c) => isValidLatLng(c.latitude, c.longitude))
      : [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={RIDER_MAP_STYLE}
        region={safeRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {safeRoute.length >= 2 ? (
          <Polyline coordinates={safeRoute} strokeColor={COLORS.riderBlue} strokeWidth={3} />
        ) : null}
        {safeMarker ? <Marker coordinate={safeMarker} pinColor={COLORS.riderBlue} /> : null}
      </MapView>

      {showAnchorOverlay ? (
        <View style={styles.anchorOverlay} pointerEvents="none">
          <View style={styles.anchorGlow}>
            <Ionicons name="anchor" size={28} color={COLORS.riderOrange} />
          </View>
        </View>
      ) : null}

      {mapPlaceholder ? (
        <View style={styles.placeholder} pointerEvents="none">
          {mapPlaceholder}
        </View>
      ) : null}

      <SafeAreaView style={styles.topBar} edges={['top']}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        {statusLabel ? (
          <RiderStatusPill label={statusLabel} tone={statusTone} displayId={displayId} />
        ) : (
          <View />
        )}
        <View style={styles.backBtn} />
      </SafeAreaView>

      <View style={styles.bottom}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.riderNavy },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.riderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { flex: 1, justifyContent: 'flex-end' },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 180,
  },
  anchorGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.riderOrangeMuted,
    borderWidth: 2,
    borderColor: COLORS.riderOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.riderOrange,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default RiderMapLayout;
