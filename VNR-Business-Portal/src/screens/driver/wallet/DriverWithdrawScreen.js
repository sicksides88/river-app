import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { driverWalletService, walletService } from '../../../services';

const MIN_WITHDRAWAL = 1000;

const DriverWithdrawScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, accountsRes] = await Promise.all([
        driverWalletService.getWallet(),
        walletService.getBankAccounts(),
      ]);

      if (walletRes.success) {
        setWallet(walletRes.wallet);
      }

      if (accountsRes.success) {
        const accounts = accountsRes.accounts || [];
        setBankAccounts(accounts);
        // Auto-select default or first account
        const defaultAccount = accounts.find((a) => a.is_default) || accounts[0];
        if (defaultAccount) {
          setSelectedAccount(defaultAccount);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const availableBalance = wallet?.availableBalance || 0;
  const numericAmount = parseFloat(amount) || 0;

  const canWithdraw =
    numericAmount >= MIN_WITHDRAWAL &&
    numericAmount <= availableBalance &&
    selectedAccount;

  const handleAmountChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const handleMaxAmount = () => {
    setAmount(String(Math.floor(availableBalance)));
  };

  const handleSubmit = async () => {
    if (!canWithdraw) return;

    Alert.alert(
      'Confirmar retiro',
      `Vas a retirar ${driverWalletService.formatCurrency(numericAmount)} a tu cuenta ${selectedAccount.bank_name}.\n\nEl dinero llegara en 24-48 horas habiles.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await driverWalletService.requestWithdrawal(
                numericAmount,
                selectedAccount.id
              );

              if (response.success) {
                Alert.alert(
                  'Retiro solicitado',
                  'Tu solicitud de retiro ha sido enviada. Recibiras el dinero en 24-48 horas habiles.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Error', response.message || 'No se pudo procesar el retiro');
              }
            } catch (error) {
              console.error('Error requesting withdrawal:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Error al solicitar el retiro'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Retirar ganancias</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Available balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>
              {driverWalletService.formatCurrency(availableBalance)}
            </Text>
          </View>

          {/* Amount input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Monto a retirar</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={handleMaxAmount}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              Minimo: {driverWalletService.formatCurrency(MIN_WITHDRAWAL)}
            </Text>

            {numericAmount > availableBalance && (
              <Text style={styles.errorText}>
                El monto excede tu saldo disponible
              </Text>
            )}
          </View>

          {/* Bank account selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Cuenta destino</Text>

            {bankAccounts.length === 0 ? (
              <View style={styles.noAccountCard}>
                <Ionicons name="card-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.noAccountText}>
                  No tienes cuentas bancarias registradas
                </Text>
                <TouchableOpacity
                  style={styles.addAccountButton}
                  onPress={() => navigation.navigate('AddBankAccount')}
                >
                  <Text style={styles.addAccountButtonText}>Agregar cuenta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bankAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountCard,
                    selectedAccount?.id === account.id && styles.accountCardSelected,
                  ]}
                  onPress={() => setSelectedAccount(account)}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountBank}>{account.bank_name}</Text>
                    <Text style={styles.accountDetails}>
                      {account.alias || `CBU: ...${account.cbu?.slice(-4)}`}
                    </Text>
                    <Text style={styles.accountHolder}>{account.holder_name}</Text>
                  </View>
                  {selectedAccount?.id === account.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}

            {bankAccounts.length > 0 && (
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={() => navigation.navigate('AddBankAccount')}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
                <Text style={styles.addAnotherButtonText}>Agregar otra cuenta</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Informacion sobre retiros</Text>
              <Text style={styles.infoText}>
                {'\u2022'} El dinero llegara en 24-48 horas habiles{'\n'}
                {'\u2022'} Monto minimo: {driverWalletService.formatCurrency(MIN_WITHDRAWAL)}{'\n'}
                {'\u2022'} Sin comision por retiro
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, !canWithdraw && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canWithdraw || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                Retirar {numericAmount > 0 ? driverWalletService.formatCurrency(numericAmount) : ''}
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  balanceCard: {
    backgroundColor: COLORS.text,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  balanceLabel: {
    fontSize: SIZES.small,
    color: COLORS.white,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.white,
  },
  inputSection: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  currencySymbol: {
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SIZES.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: SIZES.md,
  },
  maxButton: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  maxButtonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputHint: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  noAccountCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  noAccountText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.md,
  },
  addAccountButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  addAccountButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  accountCardSelected: {
    borderColor: COLORS.primary,
  },
  accountInfo: {
    flex: 1,
  },
  accountBank: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountDetails: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accountHolder: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
  },
  addAnotherButtonText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginLeft: SIZES.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginTop: SIZES.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  infoTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  infoText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  submitButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default DriverWithdrawScreen;
