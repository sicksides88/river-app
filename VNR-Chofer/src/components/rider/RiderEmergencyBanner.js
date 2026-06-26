import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, EMERGENCY_TYPES } from '../../constants/theme';

const RiderEmergencyBanner = ({ emergencyType, label, compact }) => {
  const resolved =
    label || EMERGENCY_TYPES.find((e) => e.id === emergencyType)?.label || emergencyType || 'Auxilio';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Ionicons name="warning-outline" size={18} color={COLORS.riderRed} />
      <Text style={styles.text}>{String(resolved).toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.riderRed,
    backgroundColor: COLORS.riderRedMuted,
  },
  text: { color: COLORS.riderRed, fontWeight: '700', fontSize: SIZES.caption, letterSpacing: 0.5 },
  wrapCompact: { marginBottom: SIZES.md },
});

export default RiderEmergencyBanner;
