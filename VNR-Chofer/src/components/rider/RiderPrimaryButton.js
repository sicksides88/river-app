import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderPrimaryButton = ({ title, onPress, loading, disabled, variant = 'primary', style, textStyle }) => {
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isDanger && styles.danger,
        isOutline && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? COLORS.riderBlue : COLORS.white} />
      ) : (
        <Text style={[styles.text, isOutline && styles.outlineText, isDanger && styles.dangerText, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.riderBlueDark,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.buttonHeight,
  },
  danger: { backgroundColor: COLORS.riderRed },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.riderBlue,
  },
  disabled: { opacity: 0.5 },
  text: { color: COLORS.white, fontSize: SIZES.subtitle, fontWeight: '700' },
  outlineText: { color: COLORS.riderBlue },
  dangerText: { color: COLORS.white },
});

export default RiderPrimaryButton;
