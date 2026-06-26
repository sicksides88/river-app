import React, { useState, useEffect } from 'react';
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

const WithdrawScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, accountsRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getBankAccounts(),
      ]);

      if (walletRes.success) {
        setBalance(walletRes.balance || 0);
      }

      if (accountsRes.success) {
        setBankAccounts(accountsRes.accounts || []);
        const defaultAccount = accountsRes.accounts?.find((a) => a.isDefault);
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

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const setMaxAmount = () => {
    setAmount(Math.floor(balance).toString());
  };

  const handleWithdraw = async () => {
    const numAmount = parseInt(amount, 10);

    if (!numAmount || numAmount < 500) {
      Alert.alert('Error', 'El monto minimo de retiro es $500');
      return;
    }

    if (numAmount > balance) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('Error', 'Selecciona una cuenta bancaria');
      return;
    }

    Alert.alert(
      'Confirmar retiro',
      `Vas a retirar ${paymentService.formatCurrency(numAmount)} a tu cuenta ${selectedAccount.bankName} terminada en ${selectedAccount.cbuLastDigits}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: processWithdraw },
      ]
    );
  };

  const processWithdraw = async () => {
    setSubmitting(true);

    try {
      const response = await walletService.requestWithdrawal(
        parseInt(amount, 10),
        selectedAccount.id
      );

      if (response.success) {
        Alert.alert(
          'Retiro solicitado',
          'Tu solicitud de retiro ha sido procesada. El dinero llegara a tu cuenta en 24-48 horas habiles.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo procesar el retiro');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al procesar el retiro');
    } finally {
      setSubmitting(false);
    }
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

  const numAmount = parseInt(amount, 10) || 0;
  const isValidAmount = numAmount >= 500 && numAmount <= balance;

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

          <Text style={styles.headerTitle}>Retirar saldo</Text>

          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Available Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>
              {paymentService.formatCurrency(balance)}
            </Text>
          </View>

          {/* Amount Input */}
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
              />
              <TouchableOpacity style={styles.maxButton} onPress={setMaxAmount}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.limitText}>Minimo: $500</Text>
          </View>

          {/* Bank Account Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Cuenta destino</Text>

            {bankAccounts.length === 0 ? (
              <TouchableOpacity
                style={styles.addAccountCard}
                onPress={() => navigation.navigate('AddBankAccount')}
              >
                <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                <Text style={styles.addAccountText}>Agregar cuenta bancaria</Text>
              </TouchableOpacity>
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
                    <View style={styles.accountIcon}>
                      <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.accountBank}>{account.bankName}</Text>
                      <Text style={styles.accountNumber}>
                        **** {account.cbuLastDigits}
                      </Text>
                    </View>
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
                <Text style={styles.addAnotherText}>Agregar otra cuenta</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              El retiro sera procesado en 24-48 horas habiles
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              (!isValidAmount || !selectedAccount || submitting) && styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={!isValidAmount || !selectedAccount || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.withdrawButtonText}>
                Retirar {isValidAmount ? paymentService.formatCurrency(numAmount) : ''}
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
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  balanceLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  inputSection: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    ...SHADOWS.sm,
  },
  currencySymbol: {
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.text,
  },
  amountInput: {
    flex: 1,
    fontSize: SIZES.h2,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: SIZES.md,
    marginLeft: SIZES.xs,
  },
  maxButton: {
    backgroundColor: COLORS.white + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  maxButtonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  limitText: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginTop: SIZES.xs,
  },
  addAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  addAccountText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SIZES.sm,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  accountBank: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountNumber: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
  },
  addAnotherText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginLeft: SIZES.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginLeft: SIZES.sm,
  },
  bottomContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  withdrawButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
  },
  withdrawButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  withdrawButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default WithdrawScreen;
