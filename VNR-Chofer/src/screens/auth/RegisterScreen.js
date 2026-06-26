import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, TermsAndConditionsModal } from '../../components/common';
import { COLORS, SIZES } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    cuitCuil: '',
    tieneComercio: false,
    domicilioComercio: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const formatCuitCuil = (text) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  };

  const handleChange = (field, value) => {
    if (field === 'cuitCuil') {
      value = formatCuitCuil(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
    }
    if (!formData.cuitCuil.trim()) {
      errors.cuitCuil = 'El CUIT/CUIL es requerido';
    } else {
      const cuitDigits = formData.cuitCuil.replace(/\D/g, '');
      if (cuitDigits.length !== 11) {
        errors.cuitCuil = 'El CUIT/CUIL debe tener 11 dígitos';
      }
    }
    if (formData.tieneComercio && !formData.domicilioComercio.trim()) {
      errors.domicilioComercio = 'El domicilio del comercio es requerido';
    }
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!acceptTerms) {
      errors.terms = 'Debes aceptar los términos y condiciones';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await register({
      nombre: formData.firstName.trim(),
      apellido: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      codigoPais: '+54',
      telefono: formData.phone.replace(/\s/g, ''),
      direccion: formData.address.trim(),
      cuit_cuil: formData.cuitCuil.replace(/-/g, ''),
      tiene_comercio: formData.tieneComercio,
      domicilio_comercio: formData.tieneComercio ? formData.domicilioComercio.trim() : null,
    });

    if (result.success) {
      Alert.alert('Éxito', 'Cuenta creada exitosamente');
    } else {
      Alert.alert('Error', result.error || 'Error al registrar');
    }
  };

  const Checkbox = ({ checked, onPress, label, error: checkError, onLabelPress }) => (
    <View style={styles.checkboxContainer}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.checkboxTouchable}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onLabelPress || onPress}
        activeOpacity={0.7}
        style={styles.checkboxLabelTouchable}
      >
        <Text style={[styles.checkboxLabel, checkError && styles.checkboxLabelError, onLabelPress && styles.checkboxLabelLink]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleAcceptTerms = () => {
    setAcceptTerms(true);
    setShowTermsModal(false);
    if (formErrors.terms) {
      setFormErrors(prev => ({ ...prev, terms: null }));
    }
  };

  // Shared dark input props
  const darkInputProps = {
    style: styles.darkInput,
    inputStyle: styles.darkInputText,
    placeholderTextColor: COLORS.authInputPlaceholder,
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo VNR con halo azul */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../assets/logo-vnr-transparent.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoTagline}>App para Choferes</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>CHOFER</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Registro</Text>
          <Text style={styles.subtitle}>
            Para iniciar sesión, ingresá tu correo{'\n'}electrónico y contraseña.
          </Text>

          {/* Form */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Input
              placeholder="Nombre"
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              autoCapitalize="words"
              error={formErrors.firstName}
              {...darkInputProps}
            />

            <Input
              placeholder="Apellido"
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              autoCapitalize="words"
              error={formErrors.lastName}
              {...darkInputProps}
            />

            <Input
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
              {...darkInputProps}
            />

            {/* Phone with country code */}
            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countryCodeButton}>
                <Text style={styles.flagEmoji}>🇦🇷</Text>
                <Text style={styles.countryCode}>+54</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.authTextSecondary} />
              </TouchableOpacity>
              <View style={styles.phoneInputWrapper}>
                <Input
                  placeholder="Número de Teléfono"
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  keyboardType="phone-pad"
                  error={formErrors.phone}
                  containerStyle={styles.phoneInput}
                  {...darkInputProps}
                />
              </View>
            </View>

            <Input
              placeholder="Dirección"
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              error={formErrors.address}
              {...darkInputProps}
            />

            <Input
              placeholder="CUIT/CUIL (XX-XXXXXXXX-X)"
              value={formData.cuitCuil}
              onChangeText={(value) => handleChange('cuitCuil', value)}
              keyboardType="numeric"
              maxLength={13}
              error={formErrors.cuitCuil}
            />

            {/* Checkbox Comercio */}
            <View style={styles.checkboxSection}>
              <Checkbox
                checked={formData.tieneComercio}
                onPress={() => handleChange('tieneComercio', !formData.tieneComercio)}
                label="Tengo comercio"
              />
            </View>

            {formData.tieneComercio && (
              <>
                <Input
                  placeholder="Domicilio del comercio"
                  value={formData.domicilioComercio}
                  onChangeText={(value) => handleChange('domicilioComercio', value)}
                  error={formErrors.domicilioComercio}
                />
                <Text style={styles.afipNote}>
                  Podrás subir el certificado AFIP luego en tu perfil
                </Text>
              </>
            )}

            <Input
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry
              error={formErrors.password}
              {...darkInputProps}
            />

            <Input
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              secureTextEntry
              error={formErrors.confirmPassword}
              {...darkInputProps}
            />

            {/* Checkbox Términos */}
            <View style={styles.checkboxSection}>
              <Checkbox
                checked={acceptTerms}
                onPress={() => setAcceptTerms(!acceptTerms)}
                onLabelPress={() => setShowTermsModal(true)}
                label="Acepto los Términos y Condiciones y la Política de Privacidad."
                error={formErrors.terms}
              />
            </View>

            {/* Submit Button */}
            <Button
              title="Continuar"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />

            {/* Verify Link */}
            <TouchableOpacity style={styles.verifyContainer}>
              <Text style={styles.verifyText}>Verificar Ahora</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya estás registrado? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptTerms}
        type="user"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.authBackground,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  logoWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
  },
  logo: {
    width: 140,
    height: 140,
  },
  logoTagline: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: -SIZES.sm,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.authText,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: SIZES.md,
    borderRadius: SIZES.radiusXl,
    marginBottom: SIZES.md,
  },
  errorBannerText: {
    color: '#DC2626',
    marginLeft: SIZES.sm,
    flex: 1,
    fontSize: SIZES.body,
  },
  // Dark input overrides
  darkInput: {
    backgroundColor: COLORS.authInputBg,
    borderWidth: 1,
    borderColor: COLORS.authInputBorder,
  },
  darkInputText: {
    color: COLORS.authInputText,
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.authInputBg,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.authInputBorder,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
    minHeight: SIZES.inputHeight,
    gap: SIZES.xs,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: SIZES.body,
    color: COLORS.authText,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneInput: {
    marginBottom: 0,
  },
  afipNote: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SIZES.md,
    marginTop: -SIZES.sm,
    fontStyle: 'italic',
  },
  checkboxSection: {
    marginBottom: SIZES.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  checkboxTouchable: {
    marginRight: SIZES.sm,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.authInputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.authAccent,
    borderColor: COLORS.authAccent,
  },
  checkboxLabelTouchable: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
    lineHeight: 20,
  },
  checkboxLabelLink: {
    textDecorationLine: 'underline',
  },
  checkboxLabelError: {
    color: COLORS.error,
  },
  submitButton: {
    marginTop: SIZES.sm,
    backgroundColor: COLORS.authAccent,
  },
  verifyContainer: {
    alignItems: 'center',
    marginTop: SIZES.xl,
  },
  verifyText: {
    fontSize: SIZES.body,
    color: COLORS.authText,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  loginText: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
  },
  loginLink: {
    fontSize: SIZES.body,
    color: COLORS.authText,
    fontWeight: '700',
  },
});

export default RegisterScreen;
