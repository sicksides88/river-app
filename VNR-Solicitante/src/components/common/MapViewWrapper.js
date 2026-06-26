import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { CONFIG } from '../../constants/config';

// Helper para validar coordenadas
const isValidCoordinate = (coord) => {
  return (
    coord !== null &&
    coord !== undefined &&
    typeof coord === 'number' &&
    !isNaN(coord) &&
    isFinite(coord)
  );
};

const isValidLatLng = (lat, lng) => {
  return (
    isValidCoordinate(lat) &&
    isValidCoordinate(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

const MapViewWrapper = ({
  origin,
  destination,
  markers = [],
  showRoute = false,
  routeCoordinates: externalRouteCoordinates = null, // Pre-computed route coordinates
  driverLocation = null, // Real-time driver location { latitude, longitude, heading }
  driverHeading = 0, // Driver heading for rotation
  hideOriginMarker = false, // Hide origin marker (useful when driverLocation is at origin)
  hideDestinationMarker = false, // Hide destination marker
  onMapReady,
  onRegionChange,
  style,
  initialRegion,
  showsUserLocation = true,
  followsUserLocation = false,
  edgePadding = { top: 80, right: 50, bottom: 200, left: 50 }, // Custom edge padding for fitToCoordinates
  navigationMode = false, // GPS navigation mode - centers on driver with heading rotation and zoom
  navigationZoom = 17, // Zoom level for navigation mode (higher = more zoom)
  children,
}) => {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [internalRouteCoordinates, setInternalRouteCoordinates] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Normalizar y validar coordenadas de origen
  const normalizedOrigin = origin ? {
    lat: origin.lat ?? origin.latitude,
    lng: origin.lng ?? origin.longitude,
    title: origin.title,
    description: origin.description,
  } : null;

  // Normalizar y validar coordenadas de destino
  const normalizedDestination = destination ? {
    lat: destination.lat ?? destination.latitude,
    lng: destination.lng ?? destination.longitude,
    title: destination.title,
    description: destination.description,
  } : null;

  // Verificar si las coordenadas son válidas
  const hasValidOrigin = normalizedOrigin && isValidLatLng(normalizedOrigin.lat, normalizedOrigin.lng);
  const hasValidDestination = normalizedDestination && isValidLatLng(normalizedDestination.lat, normalizedDestination.lng);

  // Use external route coordinates if provided, otherwise use internal
  const routeCoordinates = externalRouteCoordinates || internalRouteCoordinates;

  // Default region (Buenos Aires, Argentina)
  const defaultRegion = {
    latitude: -34.6037,
    longitude: -58.3816,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    // In navigation mode, don't fit to markers - use camera animation instead
    if (navigationMode && driverLocation && isMapReady) {
      animateToNavigationView();
    } else if (isMapReady && (hasValidOrigin || hasValidDestination || driverLocation)) {
      fitToMarkers();
    }
  }, [isMapReady, hasValidOrigin, hasValidDestination, normalizedOrigin?.lat, normalizedOrigin?.lng, normalizedDestination?.lat, normalizedDestination?.lng, driverLocation, navigationMode]);

  // Navigation mode camera animation
  const animateToNavigationView = () => {
    if (!mapRef.current || !driverLocation) return;

    const heading = driverLocation.heading || 0;

    mapRef.current.animateCamera({
      center: {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      },
      pitch: 60, // Tilt the camera for 3D effect
      heading: heading, // Rotate map based on vehicle direction
      zoom: navigationZoom,
    }, { duration: 500 });
  };

  useEffect(() => {
    // Only fetch route if external coordinates are not provided and we have valid coordinates
    if (showRoute && hasValidOrigin && hasValidDestination && !externalRouteCoordinates) {
      fetchRoute();
    } else if (!showRoute) {
      setInternalRouteCoordinates([]);
    }
  }, [showRoute, hasValidOrigin, hasValidDestination, normalizedOrigin?.lat, normalizedOrigin?.lng, normalizedDestination?.lat, normalizedDestination?.lng, externalRouteCoordinates]);

  const fetchRoute = async () => {
    if (!hasValidOrigin || !hasValidDestination) return;

    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured');
      return;
    }

    setIsLoadingRoute(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${normalizedOrigin.lat},${normalizedOrigin.lng}&destination=${normalizedDestination.lat},${normalizedDestination.lng}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setInternalRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Decode Google polyline
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const fitToMarkers = () => {
    if (!mapRef.current) return;

    const coordinates = [];

    if (hasValidOrigin) {
      coordinates.push({ latitude: normalizedOrigin.lat, longitude: normalizedOrigin.lng });
    }

    if (hasValidDestination) {
      coordinates.push({ latitude: normalizedDestination.lat, longitude: normalizedDestination.lng });
    }

    // Include driver location for fitting
    if (driverLocation?.latitude && driverLocation?.longitude &&
        isValidLatLng(driverLocation.latitude, driverLocation.longitude)) {
      coordinates.push({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      });
    }

    markers.forEach((marker) => {
      if (marker.excludeFromFit) return; // Skip markers that shouldn't affect zoom
      if (marker.coordinate?.latitude && marker.coordinate?.longitude &&
          isValidLatLng(marker.coordinate.latitude, marker.coordinate.longitude)) {
        coordinates.push(marker.coordinate);
      }
    });

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding,
        animated: true,
      });
    }
  };

  const handleMapReady = () => {
    setIsMapReady(true);
    onMapReady?.();
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion || defaultRegion}
        showsUserLocation={showsUserLocation}
        followsUserLocation={followsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={handleMapReady}
        onRegionChangeComplete={onRegionChange}
      >
        {/* Origin Marker */}
        {hasValidOrigin && !hideOriginMarker && (
          <Marker
            coordinate={{ latitude: normalizedOrigin.lat, longitude: normalizedOrigin.lng }}
            title={normalizedOrigin.title || 'Origen'}
            description={normalizedOrigin.description}
            pinColor={COLORS.success}
          />
        )}

        {/* Destination Marker */}
        {hasValidDestination && !hideDestinationMarker && (
          <Marker
            coordinate={{ latitude: normalizedDestination.lat, longitude: normalizedDestination.lng }}
            title={normalizedDestination.title || 'Destino'}
            description={normalizedDestination.description}
            pinColor={COLORS.error}
          />
        )}

        {/* Custom Markers (non-driver) */}
        {markers.filter(m => !m.isDriver && m.coordinate && isValidLatLng(m.coordinate.latitude, m.coordinate.longitude)).map((marker, index) => (
          <Marker
            key={marker.id || index}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.color || COLORS.black}
          />
        ))}

        {/* Driver Marker - with rotation based on heading */}
        {driverLocation && isValidLatLng(driverLocation.latitude, driverLocation.longitude) && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={navigationMode ? 0 : (driverLocation.heading || 0)}
          >
            <View style={styles.driverMarkerContainer}>
              <View style={styles.driverMarkerPulse} />
              <View style={[
                styles.driverMarker,
                navigationMode && styles.driverMarkerNavigation
              ]}>
                {navigationMode ? (
                  <View style={styles.navigationArrow}>
                    <View style={styles.navigationArrowInner} />
                  </View>
                ) : (
                  <Ionicons name="car" size={20} color={COLORS.white} />
                )}
              </View>
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor={COLORS.black}
          />
        )}

        {children}
      </MapView>

      {/* Loading overlay - only show when fetching internally */}
      {isLoadingRoute && !externalRouteCoordinates && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.black} />
          <Text style={styles.loadingText}>Calculando ruta...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: SIZES.radius,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: SIZES.md,
    left: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusXl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginLeft: SIZES.sm,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Driver marker styles
  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  driverArrow: {
    position: 'absolute',
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.text,
  },
  // Navigation mode styles
  driverMarkerNavigation: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4285F4', // Google Maps blue
  },
  navigationArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationArrowInner: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
  },
});

export default MapViewWrapper;
