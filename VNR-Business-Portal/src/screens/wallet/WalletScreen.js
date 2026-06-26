import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { walletService, paymentService } from '../../services';

const WalletScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions({ limit: 5 }),
      ]);

      if (walletRes.success) {
        setWallet(walletRes.wallet);
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.transactions || []);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: 'arrow-down-circle',
      withdrawal: 'arrow-up-circle',
      payment: 'cart',
      refund: 'refresh-circle',
      bonus: 'gift',
    };
    return icons[type] || 'swap-horizontal';
  };

  const getTransactionColor = (type) => {
    const colors = {
      deposit: COLORS.success,
      refund: COLORS.success,
      bonus: COLORS.success,
      withdrawal: COLORS.error,
      payment: COLORS.error,
    };
    return colors[type] || COLORS.text;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const balance = wallet?.balance || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mi Billetera</Text>

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
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceAmount}>
            {paymentService.formatCurrency(balance)}
          </Text>

          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Deposit')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="add" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.actionText}>Recargar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Withdraw')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-up" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.actionText}>Retirar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate('BankAccounts')}
          >
            <Ionicons name="card-outline" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Cuentas bancarias</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Ionicons name="list-outline" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Historial completo</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimientos recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No hay movimientos aun</Text>
              <Text style={styles.emptySubtext}>
                Recarga saldo para comenzar a usar tu billetera
              </Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: getTransactionColor(tx.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getTransactionIcon(tx.type)}
                    size={20}
                    color={getTransactionColor(tx.type)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {tx.description || tx.type}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(tx.created_at)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(tx.type) },
                  ]}
                >
                  {tx.type === 'payment' || tx.type === 'withdrawal' ? '-' : '+'}
                  {paymentService.formatCurrency(Math.abs(tx.amount))}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Wallet Status */}
        {wallet?.isBlocked && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={COLORS.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Billetera bloqueada</Text>
              <Text style={styles.warningText}>
                {wallet.blockedReason || 'Contacta a soporte para mas informacion'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: SIZES.xxl,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    marginBottom: SIZES.lg,
  },
  balanceLabel: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SIZES.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
  },
  actionText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: '500',
  },
  quickActions: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  quickActionText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginLeft: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptySubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  transactionType: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '20',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
  },
  warningContent: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  warningTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.warning,
  },
  warningText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default WalletScreen;
