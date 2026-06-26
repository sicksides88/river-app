import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { authService } from '../../services/auth.service';
import { COLORS, SIZES } from '../../constants/theme';

const CambiarContrasenaScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setError('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Listo', 'Contraseña actualizada exitosamente', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setError(result.message || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar la contraseña';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Contraseña</Text>
        <Text style={styles.subtitle}>
          La contraseña debe tener un mínimo de 8 caracteres y contener al menos un dígito y una letra o símbolo.
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Current Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowCurrent(!showCurrent)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Update Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Actualizar"
            onPress={handleUpdate}
            loading={loading}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
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
    marginBottom: SIZES.md,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  buttonContainer: {
    marginTop: SIZES.md,
  },
});

export default CambiarContrasenaScreen;
