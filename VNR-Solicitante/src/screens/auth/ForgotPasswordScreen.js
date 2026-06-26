import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { authService } from '../../services/auth.service';
import { COLORS, SIZES } from '../../constants/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setError('');

    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.forgotPassword(email.trim().toLowerCase());
      if (result.success) {
        navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
      } else {
        setError(result.message || 'Error al enviar el código');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar el código';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={48} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa el email asociado a tu cuenta y te enviaremos un código para restablecer tu contraseña.
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Button
            title="Enviar código"
            onPress={handleSendCode}
            loading={loading}
            fullWidth
          />

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
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
  flex: {
    flex: 1,
  },
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
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.md,
    gap: SIZES.xs,
  },
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    marginBottom: SIZES.lg,
  },
  inputIcon: {
    paddingLeft: SIZES.md,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  backToLoginText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
