import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { COLORS, SIZES } from '../../constants/theme';

// CambiarTelefonoScreen - Cambiar teléfono de recuperación basado en Figma
const CambiarTelefonoScreen = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('+54');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!phoneNumber.trim()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement phone update with verification
      console.log('Updating phone:', countryCode + phoneNumber);
      // Navigate to verification screen or show success
      navigation.goBack();
    } catch (error) {
      console.error('Error updating phone:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryCodePress = () => {
    // TODO: Show country code picker modal
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Teléfono para la{'\n'}recuperación</Text>
        <Text style={styles.subtitle}>Usa este número para recuperar tu cuenta.</Text>

        {/* Phone Input */}
        <View style={styles.phoneInputContainer}>
          {/* Country Code */}
          <TouchableOpacity
            style={styles.countryCodeButton}
            onPress={handleCountryCodePress}
            activeOpacity={0.7}
          >
            <Text style={styles.flagEmoji}>🇦🇷</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.text} />
            <Text style={styles.countryCodeText}>{countryCode}</Text>
          </TouchableOpacity>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Phone Number Input */}
          <TextInput
            style={styles.phoneInput}
            placeholder="Número de Teléfono"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Se enviará un código de verificación a este número.
        </Text>

        {/* Update Button */}
        <Button
          title="Actualizar"
          onPress={handleUpdate}
          loading={loading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
  },

  // Title
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.xl,
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SIZES.md,
    paddingRight: SIZES.sm,
  },
  flagEmoji: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.sm,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
  },

  // Help Text
  helpText: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.xl,
  },
});

export default CambiarTelefonoScreen;
