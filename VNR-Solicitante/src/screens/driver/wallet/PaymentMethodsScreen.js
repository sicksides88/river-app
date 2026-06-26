import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { walletService } from '../../../services';

const PaymentMethodsScreen = ({ navigation }) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadBankAccounts = async () => {
    try {
      const response = await walletService.getBankAccounts();
      if (response.success) {
        setBankAccounts(response.accounts || []);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBankAccounts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBankAccounts();
  };

  const handleSetDefault = async (accountId) => {
    try {
      const response = await walletService.setDefaultBankAccount(accountId);
      if (response.success) {
        loadBankAccounts();
      } else {
        Alert.alert('Error', response.message || 'No se pudo establecer como predeterminada');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      Alert.alert('Error', 'No se pudo establecer como predeterminada');
    }
  };

  const handleDelete = (account) => {
    Alert.alert(
      'Eliminar cuenta',
      `¿Estás seguro de eliminar la cuenta ${account.alias || account.bankName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => confirmDelete(account.id),
        },
      ]
    );
  };

  const confirmDelete = async (accountId) => {
    setDeletingId(accountId);
    try {
      const response = await walletService.deleteBankAccount(accountId);
      if (response.success) {
        setBankAccounts((prev) => prev.filter((a) => a.id !== accountId));
      } else {
        Alert.alert('Error', response.message || 'No se pudo eliminar la cuenta');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'No se pudo eliminar la cuenta');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cuentas bancarias</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuentas bancarias</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Agrega una cuenta bancaria para recibir tus ganancias. Las transferencias se procesan en 24-48 horas hábiles.
          </Text>
        </View>

        {/* Bank accounts list */}
        {bankAccounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sin cuentas bancarias</Text>
            <Text style={styles.emptySubtitle}>
              Agrega una cuenta para poder retirar tus ganancias
            </Text>
          </View>
        ) : (
          bankAccounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.bankIconContainer}>
                  <Ionicons name="business" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.bankName}>{account.bankName}</Text>
                  <Text style={styles.accountDetails}>
                    {account.accountType === 'savings' ? 'Caja de Ahorro' : 'Cuenta Corriente'}
                    {account.cbuLastDigits && ` •••• ${account.cbuLastDigits}`}
                  </Text>
                  {account.alias && (
                    <Text style={styles.accountAlias}>{account.alias}</Text>
                  )}
                </View>
                {account.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Principal</Text>
                  </View>
                )}
              </View>

              <Text style={styles.holderName}>Titular: {account.holderName}</Text>

              <View style={styles.accountActions}>
                {!account.isDefault && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(account.id)}
                  >
                    <Text style={styles.actionButtonText}>Establecer como principal</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(account)}
                  disabled={deletingId === account.id}
                >
                  {deletingId === account.id ? (
                    <ActivityIndicator size="small" color={COLORS.error} />
                  ) : (
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Add account button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBankAccount')}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Agregar cuenta bancaria</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginLeft: SIZES.sm,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  emptyTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  emptySubtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  bankName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountDetails: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accountAlias: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  defaultBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.success,
  },
  holderName: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    marginLeft: 52,
  },
  accountActions: {
    flexDirection: 'row',
    marginTop: SIZES.md,
    gap: SIZES.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },
  deleteButton: {
    borderColor: COLORS.error + '30',
    backgroundColor: COLORS.error + '05',
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg,
    marginTop: SIZES.md,
  },
  addButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SIZES.sm,
  },
});

export default PaymentMethodsScreen;
