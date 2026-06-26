import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const GuardiaToggle = ({ active, onToggle, label = 'EN GUARDIA · DISPONIBLE' }) => (
  <View style={styles.container}>
    <View style={styles.textWrap}>
      <View style={[styles.indicator, active && styles.indicatorActive]} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </View>
    <Switch
      value={active}
      onValueChange={onToggle}
      trackColor={{ false: COLORS.border, true: COLORS.primary }}
      thumbColor={COLORS.white}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textMuted,
    marginRight: SIZES.sm,
  },
  indicatorActive: { backgroundColor: COLORS.success },
  label: { color: COLORS.textSecondary, fontSize: SIZES.body, fontWeight: '600' },
  labelActive: { color: COLORS.success },
});

export default GuardiaToggle;
