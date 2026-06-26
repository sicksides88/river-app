import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

/**
 * DriverMarker Component
 * Animated car marker for showing driver location on map
 * Rotates based on heading/bearing
 */
const DriverMarker = ({
  coordinate,
  heading = 0,
  driverInfo,
  onPress,
  isSelected = false,
  size = 'medium',
  showPulse = true,
}) => {
  const rotateAnim = useRef(new Animated.Value(heading)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate rotation when heading changes
  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: heading,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  // Pulse animation for selected marker
  useEffect(() => {
    if (showPulse) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [showPulse]);

  const sizes = {
    small: { container: 32, icon: 18, pulse: 44 },
    medium: { container: 40, icon: 22, pulse: 56 },
    large: { container: 48, icon: 28, pulse: 64 },
  };

  const currentSize = sizes[size] || sizes.medium;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={Platform.OS === 'ios'}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.container}>
        {/* Pulse ring */}
        {showPulse && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: currentSize.pulse,
                height: currentSize.pulse,
                borderRadius: currentSize.pulse / 2,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />
        )}

        {/* Car icon container */}
        <Animated.View
          style={[
            styles.markerContainer,
            isSelected && styles.markerSelected,
            {
              width: currentSize.container,
              height: currentSize.container,
              borderRadius: currentSize.container / 2,
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <Ionicons
            name="car-sport"
            size={currentSize.icon}
            color={COLORS.white}
          />
        </Animated.View>

        {/* Direction indicator (arrow pointing direction of travel) */}
        <Animated.View
          style={[
            styles.directionIndicator,
            {
              transform: [
                { rotate: rotation },
                { translateY: -currentSize.container / 2 - 4 },
              ],
            },
          ]}
        >
          <View style={styles.arrow} />
        </Animated.View>
      </View>
    </Marker>
  );
};

/**
 * DriverMarkerCallout Component
 * Info window shown when driver marker is tapped
 */
export const DriverMarkerCallout = ({ driver, eta, distance }) => {
  return (
    <View style={styles.calloutContainer}>
      <View style={styles.calloutHeader}>
        <View style={styles.driverAvatar}>
          <Ionicons name="person" size={20} color={COLORS.white} />
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {driver?.nombre} {driver?.apellido?.charAt(0)}.
          </Text>
          {driver?.rating_average && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.ratingText}>{driver.rating_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {(eta || distance) && (
        <View style={styles.calloutFooter}>
          {eta && (
            <View style={styles.etaContainer}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.etaText}>{eta}</Text>
            </View>
          )}
          {distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: COLORS.black,
  },
  markerContainer: {
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: COLORS.primary || '#007AFF',
    transform: [{ scale: 1.1 }],
  },
  directionIndicator: {
    position: 'absolute',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.black,
  },
  // Callout styles
  calloutContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    marginLeft: 10,
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});

export default DriverMarker;
