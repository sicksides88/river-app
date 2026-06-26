import React, { useState, useCallback } from 'react';
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
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { driverWalletService, walletService } from '../../../services';

const WalletScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, earningsRes, accountsRes] = await Promise.all([
        driverWalletService.getWallet(),
        driverWalletService.getEarnings({ limit: 5 }),
        walletService.getBankAccounts(),
      ]);

      if (walletRes.success) {
        setWallet(walletRes.wallet);
      }

      if (earningsRes.success) {
        setEarnings(earningsRes.earnings || []);
      }

      if (accountsRes.success) {
        setBankAccounts(accountsRes.accounts || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
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

  const availableBalance = wallet?.availableBalance || 0;
  const pendingBalance = wallet?.pendingBalance || 0;
  const totalEarned = wallet?.totalEarned || 0;
  const hasBankAccount = bankAccounts.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Billetera</Text>

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
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceAmount}>
                {driverWalletService.formatCurrency(availableBalance)}
              </Text>
            </View>
            {availableBalance >= 1000 && hasBankAccount && (
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => navigation.navigate('DriverWithdraw')}
              >
                <Text style={styles.withdrawButtonText}>Retirar</Text>
              </TouchableOpacity>
            )}
          </View>

          {pendingBalance > 0 && (
            <View style={styles.pendingRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.pendingText}>
                {driverWalletService.formatCurrency(pendingBalance)} pendiente (72hs)
              </Text>
            </View>
          )}

          {!hasBankAccount && (
            <>
              <Text style={styles.balanceHint}>
                Agrega la cuenta bancaria en la que quieres recibir tus ganancias
              </Text>

              <TouchableOpacity
                style={styles.addAccountButton}
                onPress={() => navigation.navigate('AddBankAccount')}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addAccountButtonText}>Agregar cuenta bancaria</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('DriverEarnings')}
          >
            <Ionicons name="trending-up" size={24} color={COLORS.success} />
            <Text style={styles.statLabel}>Total ganado</Text>
            <Text style={styles.statValue}>
              {driverWalletService.formatCurrency(totalEarned)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('DriverWithdrawals')}
          >
            <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statLabel}>Retiros</Text>
            <Text style={styles.statValue}>Ver historial</Text>
          </TouchableOpacity>
        </View>

        {/* Activity section */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Actividad de ganancias</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DriverEarnings')}>
            <Text style={styles.viewAllText}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.activitySubtitle}>Ultimas ganancias</Text>

        {earnings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No hubo ganancias en las ultimas 2 semanas
            </Text>
          </View>
        ) : (
          earnings.map((earning) => (
            <View key={earning.id} style={styles.earningItem}>
              <View
                style={[
                  styles.earningIcon,
                  { backgroundColor: driverWalletService.getEarningStatusColor(earning.status) + '20' },
                ]}
              >
                <Ionicons
                  name={earning.ride_id ? 'car' : 'cube'}
                  size={20}
                  color={driverWalletService.getEarningStatusColor(earning.status)}
                />
              </View>
              <View style={styles.earningInfo}>
                <Text style={styles.earningType}>
                  {earning.ride_id ? 'Viaje' : 'Envio'}
                </Text>
                <Text style={styles.earningDate}>
                  {formatDate(earning.created_at)}
                </Text>
              </View>
              <View style={styles.earningAmounts}>
                <Text style={styles.earningAmount}>
                  +{driverWalletService.formatCurrency(earning.net_amount)}
                </Text>
                <Text
                  style={[
                    styles.earningStatus,
                    { color: driverWalletService.getEarningStatusColor(earning.status) },
                  ]}
                >
                  {driverWalletService.getEarningStatusText(earning.status)}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Menu items */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PaymentMethods')}
        >
          <Ionicons name="card-outline" size={22} color={COLORS.white} />
          <Text style={styles.menuItemText}>Cuentas bancarias</Text>
          <Ionicons name="chevron-forward" size={20} color={'rgba(255,255,255,0.7)'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={22} color={COLORS.white} />
          <Text style={styles.menuItemText}>Ayuda</Text>
        </TouchableOpacity>

        {/* Wallet blocked warning */}
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
  closeButton: {
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
    paddingBottom: SIZES.xxl,
  },
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  balanceLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
  },
  withdrawButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  withdrawButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
    alignSelf: 'flex-start',
    marginBottom: SIZES.md,
  },
  pendingText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  balanceHint: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  addAccountButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
    marginLeft: SIZES.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  statValue: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  viewAllText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  activitySubtitle: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.md,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  earningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  earningType: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  earningDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  earningAmounts: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.success,
  },
  earningStatus: {
    fontSize: SIZES.small,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  menuItemText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.white,
    marginLeft: SIZES.md,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '20',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginTop: SIZES.lg,
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
