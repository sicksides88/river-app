import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const VesselFormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  highlightValue = false,
  multiline = false,
  containerStyle,
}) => (
  <View style={[styles.wrap, containerStyle]}>
    <View style={[styles.box, error && styles.boxError]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          highlightValue && styles.inputHighlight,
          multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        multiline={multiline}
      />
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

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
  input: {
    fontSize: SIZES.subtitle,
    color: COLORS.text,
    padding: 0,
    minHeight: 24,
  },
  inputHighlight: {
    color: COLORS.info,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputMultiline: { minHeight: 44, textAlignVertical: 'top' },
  error: {
    fontSize: SIZES.caption,
    color: COLORS.errorText,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
});

export default VesselFormField;
