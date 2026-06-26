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
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sos,
  },
  disabled: { opacity: 0.5 },
  glow: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: COLORS.sosGlow,
  },
  inner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: COLORS.sos,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sos: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.8,
  },
});

export default SOSButton;
