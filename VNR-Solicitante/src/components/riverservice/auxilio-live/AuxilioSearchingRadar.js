import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, SIZES } from '../../../constants/theme';

const PULSE_COUNT = 3;
const WHITE = '#FFFFFF';
const RADAR_SIZE = 220;

const PulseRing = ({ delay, thick }) => {
  const scale = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.55,
            duration: 2400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.2, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.92, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.ring,
        thick && styles.ringThick,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

const AuxilioSearchingRadar = ({
  message = 'Buscando patrón disponible...',
  addressLabel,
  coordsLabel,
}) => (
  <View style={styles.wrap} pointerEvents="none">
    <View style={styles.dim} />

    <View style={styles.content}>
      <View style={styles.radarArea}>
        {Array.from({ length: PULSE_COUNT }).map((_, index) => (
          <PulseRing key={index} delay={index * 600} thick={index % 2 === 0} />
        ))}
        <View style={styles.core}>
          <View style={styles.coreInner} />
        </View>
      </View>

      <Text style={styles.message}>{message}</Text>
      {addressLabel ? (
        <Text style={styles.locationLine} numberOfLines={2}>
          {addressLabel}
        </Text>
      ) : null}
      {coordsLabel ? <Text style={styles.coordsLine}>{coordsLabel}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.32)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
  },
  radarArea: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  ringThick: {
    borderWidth: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  core: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  coreInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  message: {
    marginTop: SIZES.md,
    color: COLORS.text,
    fontSize: SIZES.caption,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 18,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    backgroundColor: 'rgba(11, 18, 32, 0.88)',
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationLine: {
    marginTop: SIZES.sm,
    color: COLORS.text,
    fontSize: SIZES.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SIZES.lg,
    maxWidth: 320,
  },
  coordsLine: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: SIZES.caption - 1,
    fontWeight: '500',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});

export default AuxilioSearchingRadar;
