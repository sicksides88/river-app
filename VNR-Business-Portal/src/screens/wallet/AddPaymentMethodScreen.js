import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { walletService } from '../../services';

const CARD_BRANDS = {
  visa: { name: 'Visa', color: '#1A1F71', pattern: /^4/ },
  mastercard: { name: 'Mastercard', color: '#EB001B', pattern: /^5[1-5]|^2[2-7]/ },
  amex: { name: 'American Express', color: '#006FCF', pattern: /^3[47]/ },
  diners: { name: 'Diners Club', color: '#0079BE', pattern: /^3(?:0[0-5]|[68])/ },
  discover: { name: 'Discover', color: '#FF6000', pattern: /^6(?:011|5)/ },
};

const AddPaymentMethodScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cardholderName: '',
    securityCode: '',
    setAsDefault: false,
  });
  const [detectedBrand, setDetectedBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  };

  const detectCardBrand = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    for (const [brand, info] of Object.entries(CARD_BRANDS)) {
      if (info.pattern.test(cleaned)) {
        return brand;
      }
    }
    return null;
  };

  const updateField = (field, value) => {
    let processedValue = value;

    if (field === 'cardNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 16);
      const formatted = formatCardNumber(processedValue);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
      setDetectedBrand(detectCardBrand(processedValue));
    } else if (field === 'expiryMonth') {
      processedValue = value.replace(/\D/g, '').slice(0, 2);
      if (parseInt(processedValue) > 12) processedValue = '12';
      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    } else if (field === 'expiryYear') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    } else if (field === 'securityCode') {
      const maxLength = detectedBrand === 'amex' ? 4 : 3;
      processedValue = value.replace(/\D/g, '').slice(0, maxLength);
      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateCard = () => {
    const newErrors = {};
    const cardNumber = formData.cardNumber.replace(/\s/g, '');

    if (!cardNumber || cardNumber.length < 13) {
      newErrors.cardNumber = 'Ingresa un número de tarjeta válido';
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      newErrors.expiry = 'Ingresa la fecha de vencimiento';
    } else {
      const month = parseInt(formData.expiryMonth);
      const year = parseInt(formData.expiryYear);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        newErrors.expiry = 'Mes inválido';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = 'La tarjeta está vencida';
      }
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Ingresa el nombre del titular';
    }

    const cvvLength = detectedBrand === 'amex' ? 4 : 3;
    if (!formData.securityCode || formData.securityCode.length < cvvLength) {
      newErrors.securityCode = `Ingresa el código de seguridad (${cvvLength} dígitos)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCard()) return;

    setLoading(true);

    try {
      const response = await walletService.addPaymentMethod({
        paymentType: 'card',
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: parseInt(formData.expiryMonth),
        expiryYear: parseInt(formData.expiryYear),
        cardholderName: formData.cardholderName.trim(),
        securityCode: formData.securityCode,
        setAsDefault: formData.setAsDefault,
      });

      if (response.success) {
        Alert.alert(
          'Tarjeta agregada',
          'Tu método de pago ha sido agregado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo agregar la tarjeta');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al agregar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const brandInfo = detectedBrand ? CARD_BRANDS[detectedBrand] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agregar tarjeta</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Preview */}
          <View style={[styles.cardPreview, brandInfo && { backgroundColor: brandInfo.color }]}>
            <View style={styles.cardTop}>
              <Ionicons name="card" size={28} color={COLORS.white} />
              {brandInfo && (
                <Text style={styles.cardBrandText}>{brandInfo.name}</Text>
              )}
            </View>
            <Text style={styles.cardNumberPreview}>
              {formData.cardNumber || '•••• •••• •••• ••••'}
            </Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardLabel}>TITULAR</Text>
                <Text style={styles.cardValue}>
                  {formData.cardholderName.toUpperCase() || 'NOMBRE APELLIDO'}
                </Text>
              </View>
              <View style={styles.cardExpiry}>
                <Text style={styles.cardLabel}>VENCE</Text>
                <Text style={styles.cardValue}>
                  {formData.expiryMonth || 'MM'}/{formData.expiryYear?.slice(-2) || 'AA'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de tarjeta</Text>
            <View style={[styles.inputWrapper, errors.cardNumber && styles.inputError]}>
              <TextInput
                style={styles.textInput}
                value={formData.cardNumber}
                onChangeText={(text) => updateField('cardNumber', text)}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={19}
              />
              <Ionicons
                name="card-outline"
                size={20}
                color={brandInfo ? brandInfo.color : COLORS.textMuted}
              />
            </View>
            {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
          </View>

          {/* Expiry and CVV Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Vencimiento</Text>
              <View style={styles.expiryRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.expiryInput,
                    errors.expiry && styles.inputErrorBorder,
                  ]}
                  value={formData.expiryMonth}
                  onChangeText={(text) => updateField('expiryMonth', text)}
                  placeholder="MM"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.expirySeparator}>/</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.expiryInput,
                    errors.expiry && styles.inputErrorBorder,
                  ]}
                  value={formData.expiryYear}
                  onChangeText={(text) => updateField('expiryYear', text)}
                  placeholder="AAAA"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              {errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>CVV</Text>
              <View style={[styles.inputWrapper, errors.securityCode && styles.inputError]}>
                <TextInput
                  style={styles.textInput}
                  value={formData.securityCode}
                  onChangeText={(text) => updateField('securityCode', text)}
                  placeholder={detectedBrand === 'amex' ? '••••' : '•••'}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={detectedBrand === 'amex' ? 4 : 3}
                  secureTextEntry
                />
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
              </View>
              {errors.securityCode && <Text style={styles.errorText}>{errors.securityCode}</Text>}
            </View>
          </View>

          {/* Cardholder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del titular</Text>
            <TextInput
              style={[styles.textInput, styles.fullInput, errors.cardholderName && styles.inputErrorBorder]}
              value={formData.cardholderName}
              onChangeText={(text) => updateField('cardholderName', text)}
              placeholder="Como aparece en la tarjeta"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
            {errors.cardholderName && <Text style={styles.errorText}>{errors.cardholderName}</Text>}
          </View>

          {/* Set as default */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => updateField('setAsDefault', !formData.setAsDefault)}
          >
            <View style={[styles.checkbox, formData.setAsDefault && styles.checkboxActive]}>
              {formData.setAsDefault && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Establecer como método de pago predeterminado</Text>
          </TouchableOpacity>

          {/* Security Info */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              Tu información está protegida. Nunca almacenamos el número completo de tu tarjeta.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Agregar tarjeta</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
  },
  cardPreview: {
    backgroundColor: COLORS.text,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.xl,
    height: 180,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBrandText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  cardNumberPreview: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.white,
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardExpiry: {
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  fullInput: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputErrorBorder: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  halfInput: {
    flex: 1,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  expirySeparator: {
    fontSize: SIZES.subtitle,
    color: COLORS.textMuted,
    marginHorizontal: SIZES.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.success,
    marginLeft: SIZES.sm,
  },
  bottomContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default AddPaymentMethodScreen;
