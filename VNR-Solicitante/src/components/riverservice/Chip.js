import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const Chip = ({ label, icon, selected, onPress, variant = 'default' }) => {
  const iconColor =
    variant === 'danger'
      ? selected
        ? COLORS.error
        : COLORS.errorText
      : selected
        ? COLORS.primaryAccent
        : COLORS.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.selected,
        variant === 'danger' && styles.danger,
        variant === 'danger' && selected && styles.dangerSelected,
        variant === 'warn' && styles.warn,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon ? (
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      ) : null}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
    gap: SIZES.sm,
  },
  selected: {
    backgroundColor: 'rgba(13, 148, 136, 0.18)',
    borderColor: COLORS.primaryAccent,
  },
  danger: { borderColor: 'rgba(239, 68, 68, 0.45)' },
  dangerSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: COLORS.error,
  },
  warn: { borderColor: COLORS.warning },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  text: { color: COLORS.textSecondary, fontSize: SIZES.body, fontWeight: '500' },
  textSelected: { color: COLORS.text, fontWeight: '600' },
});

export default Chip;
