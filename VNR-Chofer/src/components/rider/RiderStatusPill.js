import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderStatusPill = ({ label, tone = 'blue', displayId }) => {
  const toneColor = tone === 'orange' ? COLORS.riderOrange : tone === 'green' ? COLORS.success : COLORS.riderBlue;
  const text = displayId ? `${label} · ${displayId}` : label;

  return (
    <View style={[styles.pill, { borderColor: `${toneColor}44` }]}>
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text style={[styles.text, { color: toneColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.riderCard,
    borderWidth: 1,
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: SIZES.caption, fontWeight: '700', letterSpacing: 0.5 },
});

export default RiderStatusPill;
