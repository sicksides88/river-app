import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const SOSButton = ({ onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.outer, disabled && styles.disabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
  >
    <View style={styles.glow} />
    <View style={styles.inner}>
      <Text style={styles.sos}>SOS</Text>
      <Text style={styles.sub}>PEDIR AUXILIO</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    ...SHADOWS.sos,
  },
  disabled: { opacity: 0.5 },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.sosGlow,
    top: -10,
    left: -10,
  },
  inner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.sos,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  sos: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});

export default SOSButton;
