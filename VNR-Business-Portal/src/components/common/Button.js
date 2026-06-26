import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

// Button basado en diseño Figma
// Primary: fondo negro, texto blanco
// Secondary: fondo blanco, borde negro, texto negro
const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger'
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const getLoaderColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.white;
      case 'danger':
        return COLORS.white;
      default:
        return COLORS.black;
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radiusXl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.buttonHeight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: SIZES.sm,
  },
  iconRight: {
    marginLeft: SIZES.sm,
  },

  // Variants - Figma style
  primary: {
    backgroundColor: COLORS.black,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: COLORS.white,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.black,
  },
  outline: {
    backgroundColor: COLORS.transparent,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: COLORS.transparent,
    borderWidth: 0,
  },
  danger: {
    backgroundColor: COLORS.error,
    borderWidth: 0,
  },

  // Sizes
  small: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 40,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: SIZES.buttonHeight,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },

  // Text base
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Text variants
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.black,
  },
  outlineText: {
    color: COLORS.text,
  },
  ghostText: {
    color: COLORS.text,
  },
  dangerText: {
    color: COLORS.white,
  },

  // Text sizes
  smallText: {
    fontSize: SIZES.body,
  },
  mediumText: {
    fontSize: SIZES.subtitle,
  },
  largeText: {
    fontSize: SIZES.title,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default Button;
