import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const CODE_LENGTH = 4;

/**
 * Modal para que el cadete tipee el código de entrega (PIN de 4 dígitos) que le
 * dicta quien recibe el paquete. Valida contra el backend antes de cerrar el
 * envío: `onSubmit(pin)` debe resolver si el código es correcto y rechazar
 * (throw) con un mensaje si no lo es; el error se muestra inline sin cerrar.
 */
const DeliveryCodeModal = ({ visible, onClose, onSubmit }) => {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // Resetear cada vez que se abre
  useEffect(() => {
    if (visible) {
      setCode(Array(CODE_LENGTH).fill(''));
      setError('');
      setLoading(false);
      // foco en la primera caja
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [visible]);

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError('');
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const pin = code.join('');
    if (pin.length !== CODE_LENGTH) {
      setError('Ingresá los 4 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(pin);
      // Éxito: el padre cierra el modal y navega.
    } catch (err) {
      setError(err?.message || 'Código incorrecto');
      setCode(Array(CODE_LENGTH).fill(''));
      setLoading(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="keypad-outline" size={26} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Código de entrega</Text>
          <Text style={styles.subtitle}>
            Pedile el código a quien recibe el paquete y tipealo para confirmar la entrega.
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.confirmText}>Confirmar entrega</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl || 20,
    padding: SIZES.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  title: {
    fontSize: SIZES.subtitle || 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SIZES.small || 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  codeInput: {
    width: 52,
    height: 60,
    borderRadius: SIZES.radius || 12,
    backgroundColor: COLORS.backgroundInput || '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTint,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SIZES.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.small || 13,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull || 999,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    color: COLORS.white,
    fontSize: SIZES.body || 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: SIZES.sm,
    marginTop: SIZES.xs,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body || 15,
    fontWeight: '600',
  },
});

export default DeliveryCodeModal;
