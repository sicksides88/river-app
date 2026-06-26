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

const BANKS = [
  'Banco Nacion',
  'Banco Provincia',
  'Banco Santander',
  'Banco Galicia',
  'Banco BBVA',
  'Banco Macro',
  'Banco HSBC',
  'Banco ICBC',
  'Banco Patagonia',
  'Banco Ciudad',
  'Mercado Pago',
  'Ualá',
  'Brubank',
  'Naranja X',
  'Otro',
];

const AddBankAccountScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountType: 'savings',
    cbu: '',
    alias: '',
    holderName: '',
    holderCuit: '',
  });
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateCBU = (cbu) => {
    return /^\d{22}$/.test(cbu);
  };

  const validateCUIT = (cuit) => {
    const cleaned = cuit.replace(/[-\s]/g, '');
    return /^\d{11}$/.test(cleaned);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.bankName) {
      newErrors.bankName = 'Selecciona un banco';
    }

    if (!formData.holderName.trim()) {
      newErrors.holderName = 'Ingresa el nombre del titular';
    }

    if (!formData.cbu && !formData.alias) {
      newErrors.cbu = 'Ingresa CBU o Alias';
      newErrors.alias = 'Ingresa CBU o Alias';
    }

    if (formData.cbu && !validateCBU(formData.cbu)) {
      newErrors.cbu = 'CBU debe tener 22 digitos';
    }

    if (formData.holderCuit && !validateCUIT(formData.holderCuit)) {
      newErrors.holderCuit = 'CUIT invalido (11 digitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await walletService.addBankAccount({
        bankName: formData.bankName,
        accountType: formData.accountType,
        cbu: formData.cbu || undefined,
        alias: formData.alias || undefined,
        holderName: formData.holderName,
        holderCuit: formData.holderCuit.replace(/[-\s]/g, '') || undefined,
      });

      if (response.success) {
        Alert.alert('Cuenta agregada', 'Tu cuenta bancaria ha sido agregada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'No se pudo agregar la cuenta');
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al agregar la cuenta');
    } finally {
      setLoading(false);
    }
  };

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
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Agregar cuenta</Text>

          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bank Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Banco *</Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.bankName && styles.inputError]}
              onPress={() => setShowBankPicker(!showBankPicker)}
            >
              <Text
                style={[
                  styles.selectInputText,
                  !formData.bankName && styles.placeholderText,
                ]}
              >
                {formData.bankName || 'Seleccionar banco'}
              </Text>
              <Ionicons
                name={showBankPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}

            {showBankPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {BANKS.map((bank) => (
                    <TouchableOpacity
                      key={bank}
                      style={[
                        styles.pickerItem,
                        formData.bankName === bank && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        updateField('bankName', bank);
                        setShowBankPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          formData.bankName === bank && styles.pickerItemTextSelected,
                        ]}
                      >
                        {bank}
                      </Text>
                      {formData.bankName === bank && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Account Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de cuenta</Text>
            <View style={styles.accountTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  formData.accountType === 'savings' && styles.accountTypeButtonActive,
                ]}
                onPress={() => updateField('accountType', 'savings')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    formData.accountType === 'savings' && styles.accountTypeTextActive,
                  ]}
                >
                  Caja de Ahorro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  formData.accountType === 'checking' && styles.accountTypeButtonActive,
                ]}
                onPress={() => updateField('accountType', 'checking')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    formData.accountType === 'checking' && styles.accountTypeTextActive,
                  ]}
                >
                  Cuenta Corriente
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CBU */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CBU</Text>
            <TextInput
              style={[styles.textInput, errors.cbu && styles.inputError]}
              value={formData.cbu}
              onChangeText={(text) => updateField('cbu', text.replace(/\D/g, ''))}
              placeholder="22 digitos"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={22}
            />
            {errors.cbu && <Text style={styles.errorText}>{errors.cbu}</Text>}
          </View>

          {/* Alias */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alias (alternativa al CBU)</Text>
            <TextInput
              style={[styles.textInput, errors.alias && styles.inputError]}
              value={formData.alias}
              onChangeText={(text) => updateField('alias', text.toLowerCase())}
              placeholder="mi.alias.banco"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />
            {errors.alias && <Text style={styles.errorText}>{errors.alias}</Text>}
          </View>

          {/* Holder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del titular *</Text>
            <TextInput
              style={[styles.textInput, errors.holderName && styles.inputError]}
              value={formData.holderName}
              onChangeText={(text) => updateField('holderName', text)}
              placeholder="Como aparece en la cuenta"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
            {errors.holderName && <Text style={styles.errorText}>{errors.holderName}</Text>}
          </View>

          {/* Holder CUIT */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CUIT del titular (opcional)</Text>
            <TextInput
              style={[styles.textInput, errors.holderCuit && styles.inputError]}
              value={formData.holderCuit}
              onChangeText={(text) => updateField('holderCuit', text)}
              placeholder="XX-XXXXXXXX-X"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={13}
            />
            {errors.holderCuit && <Text style={styles.errorText}>{errors.holderCuit}</Text>}
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              Tus datos bancarios estan protegidos y solo se usan para transferir tus ganancias
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
              <Text style={styles.submitButtonText}>Agregar cuenta</Text>
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
    color: COLORS.white,
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
  inputGroup: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectInputText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textMuted,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.xs,
    maxHeight: 200,
    ...SHADOWS.md,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.white + '10',
  },
  pickerItemText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  accountTypeContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  accountTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accountTypeButtonActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  accountTypeText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  accountTypeTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginTop: SIZES.md,
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
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default AddBankAccountScreen;
