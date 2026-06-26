import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const RiderSafetyRejectLink = ({ onPress, style }) => (
  <TouchableOpacity style={[styles.wrap, style]} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name="shield-outline" size={16} color={COLORS.riderRed} />
    <Text style={styles.text}>Rechazar servicio por seguridad</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SIZES.sm,
  },
  text: { color: COLORS.riderRed, fontSize: SIZES.caption, fontWeight: '600' },
});

export default RiderSafetyRejectLink;
