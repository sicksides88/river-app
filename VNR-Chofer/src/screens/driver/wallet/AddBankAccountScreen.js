import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { walletService } from '../../../services';

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
  'Uala',
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
        Alert.alert(
          'Cuenta agregada',
          'Tu cuenta bancaria ha sido registrada exitosamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Agregar una cuenta bancaria</Text>

          {/* Bank Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Banco *</Text>
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
            <Text style={styles.inputLabel}>Tipo de cuenta</Text>
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

          {/* Holder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre del titular *</Text>
            <TextInput
              style={[styles.input, errors.holderName && styles.inputError]}
              value={formData.holderName}
              onChangeText={(text) => updateField('holderName', text)}
              placeholder="Tal como aparece en el resumen bancario"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
            {errors.holderName && <Text style={styles.errorText}>{errors.holderName}</Text>}
            <Text style={styles.inputHint}>
              Si esta cuenta no es tuya, ingresa el nombre del titular.
            </Text>
          </View>

          {/* Holder CUIT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CUIL / CUIT (opcional)</Text>
            <TextInput
              style={[styles.input, errors.holderCuit && styles.inputError]}
              value={formData.holderCuit}
              onChangeText={(text) => updateField('holderCuit', text)}
              placeholder="XX-XXXXXXXX-X"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={13}
            />
            {errors.holderCuit && <Text style={styles.errorText}>{errors.holderCuit}</Text>}
            <Text style={styles.inputHint}>
              11 digitos. Si la cuenta no es tuya, ingresa el CUIL o CUIT del titular.
            </Text>
          </View>

          {/* CBU */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CBU / CVU</Text>
            <TextInput
              style={[styles.input, errors.cbu && styles.inputError]}
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
            <Text style={styles.inputLabel}>Alias (alternativa al CBU)</Text>
            <TextInput
              style={[styles.input, errors.alias && styles.inputError]}
              value={formData.alias}
              onChangeText={(text) => updateField('alias', text.toLowerCase())}
              placeholder="mi.alias.banco"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />
            {errors.alias && <Text style={styles.errorText}>{errors.alias}</Text>}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              Tus datos bancarios estan protegidos y solo se usan para transferir tus ganancias
            </Text>
          </View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Agregar cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xl,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.xl,
  },
  inputGroup: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    fontSize: SIZES.small,
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundInput || COLORS.white,
    borderRadius: SIZES.radius || SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border || COLORS.borderLight,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  inputHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: SIZES.xs,
    lineHeight: 16,
  },
  selectInput: {
    backgroundColor: COLORS.backgroundInput || COLORS.white,
    borderRadius: SIZES.radius || SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border || COLORS.borderLight,
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
    borderColor: COLORS.border || COLORS.borderLight,
  },
  accountTypeButtonActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.text,
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
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  submitButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
  },
});

export default AddBankAccountScreen;
