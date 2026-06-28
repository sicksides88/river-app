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
import { Input, Button } from '../../components/common';
import { COLORS, SIZES } from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await login(formData.email.trim(), formData.password);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Error al iniciar sesión');
    }
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
          {/* Logo River Service */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../assets/logo-river.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoTagline}>AUXILIO NÁUTICO</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Ingresar</Text>
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
              placeholder="Correo Electrónico"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.authTextSecondary} />}
              style={styles.darkInput}
              inputStyle={styles.darkInputText}
              placeholderTextColor={COLORS.authInputPlaceholder}
            />

            <Input
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry
              error={formErrors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.authTextSecondary} />}
              style={styles.darkInput}
              inputStyle={styles.darkInputText}
              placeholderTextColor={COLORS.authInputPlaceholder}
            />

            {/* Remember & Forgot */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  )}
                </View>
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>¿Olvidaste la contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Button
              title="Continuar"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tenés cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Registrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: SIZES.xxl,
    paddingBottom: SIZES.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xl,
  },
  logoWrapper: {
    width: 300,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 300,
    height: 260,
  },
  logo: {
    width: 260,
    height: 260,
  },
  logoTagline: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: -SIZES.lg,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#2563EB',
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
    marginBottom: SIZES.xl,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.authInputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.authAccent,
    borderColor: COLORS.authAccent,
  },
  rememberText: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
  },
  forgotText: {
    fontSize: SIZES.body,
    color: COLORS.authText,
    fontWeight: '500',
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  registerText: {
    fontSize: SIZES.body,
    color: COLORS.authTextSecondary,
  },
  registerLink: {
    fontSize: SIZES.body,
    color: COLORS.authText,
    fontWeight: '700',
  },
});

export default LoginScreen;
