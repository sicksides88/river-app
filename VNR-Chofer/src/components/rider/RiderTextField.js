import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderTextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  multiline = false,
}) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputBox, !editable && styles.inputDisabled]}>
      <TextInput
        style={[styles.input, multiline && styles.multiline, !editable && styles.inputReadonly]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.md },
  label: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    fontWeight: '600',
    marginBottom: SIZES.xs,
    letterSpacing: 0.3,
  },
  inputBox: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputDisabled: { opacity: 0.7 },
  input: {
    color: COLORS.text,
    fontSize: SIZES.body,
    paddingVertical: SIZES.sm,
  },
  inputReadonly: { color: COLORS.textSecondary },
  multiline: { minHeight: 88, paddingTop: SIZES.sm },
});

export default RiderTextField;
