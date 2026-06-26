import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

// Input basado en diseño Figma - pill-shaped con fondo gris
const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  containerStyle,
  placeholderTextColor,
  variant = 'filled', // 'filled' (Figma default) or 'outlined'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isOutlined = variant === 'outlined';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        isOutlined ? styles.inputOutlined : styles.inputFilled,
        isFocused && (isOutlined ? styles.inputOutlinedFocused : styles.inputFilledFocused),
        error && styles.inputError,
        !editable && styles.inputDisabled,
        style,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || COLORS.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={placeholderTextColor || COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusXl,
    minHeight: SIZES.inputHeight,
  },
  // Figma default style - filled background, no border
  inputFilled: {
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 0,
  },
  inputFilledFocused: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  // Alternative outlined style
  inputOutlined: {
    backgroundColor: COLORS.white,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.border,
  },
  inputOutlinedFocused: {
    borderColor: COLORS.black,
  },
  inputError: {
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    paddingVertical: 14,
    fontSize: SIZES.bodyLarge,
    color: COLORS.text,
  },
  inputWithLeftIcon: {
    paddingLeft: SIZES.sm,
  },
  inputWithRightIcon: {
    paddingRight: SIZES.sm,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  iconLeft: {
    paddingLeft: SIZES.lg,
  },
  iconRight: {
    paddingRight: SIZES.lg,
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.error,
    marginTop: SIZES.xs,
    marginLeft: SIZES.lg,
  },
});

export default Input;
