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
import { driverWalletService } from '../../../services';

const DriverEarningsScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [periodData, setPeriodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectedTime, setConnectedTime] = useState('0 m 0 seg');

  const loadData = async () => {
    try {
      const [walletRes, periodRes] = await Promise.all([
        driverWalletService.getWallet(),
        driverWalletService.getWeekEarnings(),
      ]);

      if (walletRes.success) {
        setWallet(walletRes.wallet);
      }

      if (periodRes.success) {
        setPeriodData(periodRes);
        // Formatear tiempo conectado
        if (periodRes.connectedMinutes) {
          const mins = Math.floor(periodRes.connectedMinutes);
          const secs = Math.round((periodRes.connectedMinutes % 1) * 60);
          setConnectedTime(`${mins} m ${secs} seg`);
        }
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
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

  const getDateRange = () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const options = { day: 'numeric', month: 'short' };
    return `${weekAgo.toLocaleDateString('es-AR', options)} - ${now.toLocaleDateString('es-AR', options)}`;
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')}`;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      </SafeAreaView>
    );
  }

  const totalEarned = periodData?.total || 0;
  const tripsCount = periodData?.trips || 0;
  const points = periodData?.points || 0;
  const availableBalance = wallet?.availableBalance || 0;
  const pendingBalance = wallet?.pendingBalance || 0;
  const totalBalance = availableBalance + pendingBalance;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ganancias</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle" size={22} color={COLORS.white} />
            <Text style={styles.helpText}>Ayuda</Text>
          </TouchableOpacity>
        </View>

        {/* Date range */}
        <Text style={styles.dateRange}>{getDateRange()}</Text>

        {/* Total earnings */}
        <Text style={styles.totalEarnings}>{formatCurrency(totalEarned)}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Conectado</Text>
            <Text style={styles.statValue}>{connectedTime}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Viajes</Text>
            <Text style={styles.statValue}>{tripsCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValue}>{points}</Text>
          </View>
        </View>

        {/* Ver detalles button */}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('EarningsDetail')}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsButtonText}>Ver detalles</Text>
        </TouchableOpacity>

        {/* Billetera section */}
        <Text style={styles.sectionTitle}>Billetera</Text>

        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>Saldo total</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.walletBalance}>{formatCurrency(totalBalance)}</Text>

          {pendingBalance > 0 && (
            <View style={styles.balanceBreakdown}>
              <View style={styles.balanceRow}>
                <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                <Text style={styles.balanceBreakdownText}>
                  Disponible: {formatCurrency(availableBalance)}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.balanceBreakdownText}>
                  Pendiente (72hs): {formatCurrency(pendingBalance)}
                </Text>
              </View>
            </View>
          )}

          {totalBalance === 0 && (
            <Text style={styles.walletHint}>
              Completa viajes para empezar a ganar
            </Text>
          )}

          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => navigation.navigate('DriverWallet')}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color={COLORS.white} />
            <Text style={styles.withdrawButtonText}>Retirar ganancias y más</Text>
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.xl,
    marginBottom: SIZES.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
  },
  dateRange: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.sm,
  },
  totalEarnings: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginBottom: 4,
  },
  statValue: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: SIZES.md,
  },
  detailsButton: {
    backgroundColor: COLORS.backgroundInput,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  detailsButtonText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.md,
  },
  walletCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginVertical: SIZES.xs,
  },
  walletHint: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SIZES.md,
  },
  balanceBreakdown: {
    marginBottom: SIZES.md,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  balanceBreakdownText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radiusFull,
  },
  withdrawButtonText: {
    fontSize: SIZES.body,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SIZES.xs,
  },
});

export default DriverEarningsScreen;
