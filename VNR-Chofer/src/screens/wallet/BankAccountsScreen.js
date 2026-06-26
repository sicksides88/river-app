import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { walletService } from '../../services';

const BankAccountsScreen = ({ navigation }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccounts = async () => {
    try {
      const response = await walletService.getBankAccounts();
      if (response.success) {
        setAccounts(response.accounts || []);
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
      loadAccounts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const handleSetDefault = async (account) => {
    try {
      const response = await walletService.setDefaultBankAccount(account.id);
      if (response.success) {
        loadAccounts();
      }
    } catch (error) {
      console.error('Error setting default account:', error);
      Alert.alert('Error', 'No se pudo establecer como predeterminada');
    }
  };

  const handleDelete = (account) => {
    Alert.alert(
      'Eliminar cuenta',
      `Estas seguro de eliminar la cuenta ${account.bankName} terminada en ${account.cbuLastDigits}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await walletService.deleteBankAccount(account.id);
              if (response.success) {
                loadAccounts();
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            }
          },
        },
      ]
    );
  };

  const renderAccount = ({ item }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountIcon}>
          <Ionicons name="business-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountBank}>{item.bankName}</Text>
          <Text style={styles.accountHolder}>{item.holderName}</Text>
          <Text style={styles.accountNumber}>
            {item.accountType === 'savings' ? 'Caja de Ahorro' : 'Cuenta Corriente'} **** {item.cbuLastDigits}
          </Text>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Principal</Text>
          </View>
        )}
      </View>

      <View style={styles.accountActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item)}
          >
            <Ionicons name="star-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Predeterminada</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {item.isVerified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={styles.verifiedText}>Verificada</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color={'rgba(255,255,255,0.55)'} />
      <Text style={styles.emptyTitle}>Sin cuentas bancarias</Text>
      <Text style={styles.emptyText}>
        Agrega una cuenta bancaria para poder retirar tu saldo
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddBankAccount')}
      >
        <Ionicons name="add" size={20} color={COLORS.white} />
        <Text style={styles.emptyButtonText}>Agregar cuenta</Text>
      </TouchableOpacity>
    </View>
  );

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cuentas bancarias</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBankAccount')}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Accounts List */}
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />
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
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    flexGrow: 1,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  accountBank: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountHolder: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accountNumber: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  defaultBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.primary,
  },
  accountActions: {
    flexDirection: 'row',
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SIZES.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
  },
  actionButtonText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginLeft: SIZES.xs,
  },
  deleteButton: {},
  deleteButtonText: {
    color: COLORS.error,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: SIZES.md,
    right: SIZES.md,
  },
  verifiedText: {
    fontSize: SIZES.small,
    color: COLORS.success,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },
  emptyTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SIZES.md,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: SIZES.xs,
    marginBottom: SIZES.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusFull,
    gap: SIZES.xs,
  },
  emptyButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default BankAccountsScreen;
