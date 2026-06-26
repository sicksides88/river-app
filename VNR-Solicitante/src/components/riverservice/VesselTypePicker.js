import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { VESSEL_TYPE_OPTIONS } from '../../utils/vesselForm';

const VesselTypePicker = ({ value, onChange, error }) => (
  <View style={styles.wrap}>
    <Text style={styles.sectionLabel}>Tipo de embarcación</Text>
    <View style={styles.row}>
      {VESSEL_TYPE_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={opt.icon}
              size={22}
              color={selected ? COLORS.primaryAccent : COLORS.textSecondary}
            />
            <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.lg },
  sectionLabel: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.primaryAccent,
    letterSpacing: 0.8,
    marginBottom: SIZES.sm,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xs,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: 72,
  },
  optionSelected: {
    borderColor: COLORS.primaryAccent,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  optionLabel: {
    marginTop: SIZES.xs,
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
  error: {
    fontSize: SIZES.caption,
    color: COLORS.errorText,
    marginTop: SIZES.xs,
  },
});

export default VesselTypePicker;
