import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const Chip = ({ label, selected, onPress, variant = 'default' }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      selected && styles.selected,
      variant === 'danger' && styles.danger,
      variant === 'warn' && styles.warn,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  selected: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryAccent,
  },
  danger: { borderColor: COLORS.error },
  warn: { borderColor: COLORS.warning },
  text: { color: COLORS.textSecondary, fontSize: SIZES.body },
  textSelected: { color: COLORS.text, fontWeight: '600' },
});

export default Chip;
