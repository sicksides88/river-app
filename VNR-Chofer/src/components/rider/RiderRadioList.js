import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderRadioList = ({ options, value, onChange }) => (
  <View style={styles.list}>
    {options.map((opt) => {
      const selected = value === opt.id;
      return (
        <TouchableOpacity
          key={opt.id}
          style={[styles.row, selected && styles.rowSelected]}
          onPress={() => onChange(opt.id)}
          activeOpacity={0.8}
        >
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  list: { gap: SIZES.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.riderCard,
    gap: SIZES.md,
  },
  rowSelected: { borderColor: COLORS.riderBlue, backgroundColor: COLORS.riderCardElevated },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.riderBlue },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.riderBlue },
  label: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.body },
  labelSelected: { color: COLORS.text, fontWeight: '600' },
});

export default RiderRadioList;
