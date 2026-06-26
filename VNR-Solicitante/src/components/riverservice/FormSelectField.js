import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const FormSelectField = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  error,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.box, error && styles.boxError]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.row}>
          <Text style={[styles.value, !selected && styles.placeholder]}>
            {selected?.label || placeholder}
          </Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>

      {open ? (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {options.map((opt) => {
              const active = opt.id === value;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={18} color={COLORS.primaryAccent} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.md },
  box: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  boxError: { borderColor: COLORS.error },
  fieldLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  value: {
    flex: 1,
    fontSize: SIZES.subtitle,
    color: COLORS.text,
    paddingRight: SIZES.sm,
  },
  placeholder: { color: COLORS.textMuted },
  dropdown: {
    marginTop: SIZES.xs,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundTertiary,
    maxHeight: 220,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionActive: { backgroundColor: 'rgba(45, 212, 191, 0.08)' },
  optionText: { color: COLORS.textSecondary, fontSize: SIZES.body, flex: 1 },
  optionTextActive: { color: COLORS.text, fontWeight: '600' },
  error: {
    fontSize: SIZES.caption,
    color: COLORS.errorText,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
});

export default FormSelectField;
