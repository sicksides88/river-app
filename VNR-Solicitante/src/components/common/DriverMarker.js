import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

/**
 * Animated driver marker for showing driver location on map
 * Supports smooth position transitions and heading rotation
 */
const DriverMarker = ({
  coordinate,
  heading = 0,
  isAnimated = true,
  size = 'medium',
  color = COLORS.text,
  onPress,
}) => {
  const animatedCoordinate = useRef(
    new Animated.ValueXY({
      x: coordinate.latitude,
      y: coordinate.longitude,
    })
  ).current;

  const rotationAnim = useRef(new Animated.Value(heading)).current;

  // Animate to new position
  useEffect(() => {
    if (isAnimated) {
      Animated.timing(animatedCoordinate, {
        toValue: {
          x: coordinate.latitude,
          y: coordinate.longitude,
        },
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedCoordinate.setValue({
        x: coordinate.latitude,
        y: coordinate.longitude,
      });
    }
  }, [coordinate.latitude, coordinate.longitude, isAnimated]);

  // Animate heading rotation
  useEffect(() => {
    Animated.timing(rotationAnim, {
      toValue: heading,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  const sizes = {
    small: { container: 32, icon: 18, pulse: 48 },
    medium: { container: 44, icon: 24, pulse: 64 },
    large: { container: 56, icon: 32, pulse: 80 },
  };

  const sizeConfig = sizes[size] || sizes.medium;

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      onPress={onPress}
    >
      <View style={styles.container}>
        {/* Pulse animation background */}
        <View
          style={[
            styles.pulse,
            {
              width: sizeConfig.pulse,
              height: sizeConfig.pulse,
              borderRadius: sizeConfig.pulse / 2,
            },
          ]}
        />

        {/* Main marker */}
        <Animated.View
          style={[
            styles.markerContainer,
            {
              width: sizeConfig.container,
              height: sizeConfig.container,
              borderRadius: sizeConfig.container / 2,
              backgroundColor: color,
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          {/* Direction arrow */}
          <View style={styles.arrowContainer}>
            <View
              style={[
                styles.arrow,
                {
                  borderLeftWidth: sizeConfig.icon / 3,
                  borderRightWidth: sizeConfig.icon / 3,
                  borderBottomWidth: sizeConfig.icon / 2,
                },
              ]}
            />
          </View>

          {/* Car icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="car"
              size={sizeConfig.icon}
              color={COLORS.white}
            />
          </View>
        </Animated.View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  arrowContainer: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.text,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DriverMarker;
