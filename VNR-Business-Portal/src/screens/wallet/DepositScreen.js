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
import { walletService, paymentService } from '../../services';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const DepositScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const selectPresetAmount = (presetAmount) => {
    setAmount(presetAmount.toString());
  };

  const handleDeposit = async () => {
    const numAmount = parseInt(amount, 10);

    if (!numAmount || numAmount < 100) {
      Alert.alert('Error', 'El monto minimo de recarga es $100');
      return;
    }

    if (numAmount > 50000) {
      Alert.alert('Error', 'El monto maximo de recarga es $50,000');
      return;
    }

    setLoading(true);

    try {
      const response = await walletService.initiateDeposit(numAmount);

      if (response.success) {
        Alert.alert(
          'Recarga iniciada',
          'Seras redirigido a MercadoPago para completar el pago',
          [
            {
              text: 'Continuar',
              onPress: () => {
                // Aqui iria la navegacion a MercadoPago checkout
                // Por ahora volvemos al wallet
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo iniciar la recarga');
      }
    } catch (error) {
      console.error('Error initiating deposit:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al procesar la recarga');
    } finally {
      setLoading(false);
    }
  };

  const numAmount = parseInt(amount, 10) || 0;

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

          <Text style={styles.headerTitle}>Recargar saldo</Text>

          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <Text style={styles.limitText}>
            Minimo: $100 - Maximo: $50,000
          </Text>

          {/* Preset Amounts */}
          <View style={styles.presetContainer}>
            {PRESET_AMOUNTS.map((presetAmount) => (
              <TouchableOpacity
                key={presetAmount}
                style={[
                  styles.presetButton,
                  numAmount === presetAmount && styles.presetButtonActive,
                ]}
                onPress={() => selectPresetAmount(presetAmount)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    numAmount === presetAmount && styles.presetButtonTextActive,
                  ]}
                >
                  {paymentService.formatCurrency(presetAmount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Method Info */}
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodHeader}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
              <Text style={styles.paymentMethodTitle}>Pago seguro con MercadoPago</Text>
            </View>
            <Text style={styles.paymentMethodText}>
              Tu recarga sera procesada de forma segura a traves de MercadoPago.
              Puedes pagar con tarjeta, transferencia o efectivo.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.depositButton,
              (!numAmount || numAmount < 100 || loading) && styles.depositButtonDisabled,
            ]}
            onPress={handleDeposit}
            disabled={!numAmount || numAmount < 100 || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="card" size={20} color={COLORS.white} />
                <Text style={styles.depositButtonText}>
                  Recargar {numAmount >= 100 ? paymentService.formatCurrency(numAmount) : ''}
                </Text>
              </>
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.xl,
    marginBottom: SIZES.md,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    color: COLORS.text,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 100,
    textAlign: 'center',
  },
  limitText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  presetButton: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  presetButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  presetButtonTextActive: {
    color: COLORS.white,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.sm,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  paymentMethodTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  paymentMethodText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    gap: SIZES.sm,
  },
  depositButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  depositButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default DepositScreen;
