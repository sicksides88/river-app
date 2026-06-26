import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { driverWalletService } from '../../../services';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: '#FFA500',
    icon: 'time-outline',
  },
  processing: {
    label: 'Procesando',
    color: '#2196F3',
    icon: 'sync-outline',
  },
  completed: {
    label: 'Completado',
    color: '#4CAF50',
    icon: 'checkmark-circle-outline',
  },
  failed: {
    label: 'Fallido',
    color: '#F44336',
    icon: 'close-circle-outline',
  },
};

const DriverWithdrawalsScreen = ({ navigation }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = async (pageNum = 1, append = false) => {
    try {
      const response = await driverWalletService.getWithdrawals({
        page: pageNum,
        limit: 20,
      });

      if (response.success) {
        const newWithdrawals = response.withdrawals || [];
        if (append) {
          setWithdrawals((prev) => [...prev, ...newWithdrawals]);
        } else {
          setWithdrawals(newWithdrawals);
        }
        setHasMore(newWithdrawals.length === 20);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadData(1, false);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const renderWithdrawalItem = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.withdrawalCard}>
        <View style={styles.withdrawalHeader}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: statusConfig.color + '20' },
            ]}
          >
            <Ionicons
              name={statusConfig.icon}
              size={20}
              color={statusConfig.color}
            />
          </View>
          <View style={styles.withdrawalInfo}>
            <Text style={styles.withdrawalAmount}>
              -{driverWalletService.formatCurrency(item.amount)}
            </Text>
            <Text style={styles.withdrawalDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.withdrawalDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cuenta destino</Text>
            <Text style={styles.detailValue}>
              {item.bank_account?.bank_name || 'Cuenta bancaria'}
            </Text>
          </View>
          {item.bank_account?.alias && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Alias</Text>
              <Text style={styles.detailValue}>{item.bank_account.alias}</Text>
            </View>
          )}
          {item.fee > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Comision</Text>
              <Text style={styles.detailValue}>
                -{driverWalletService.formatCurrency(item.fee)}
              </Text>
            </View>
          )}
          {item.net_amount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monto neto</Text>
              <Text style={[styles.detailValue, styles.netAmount]}>
                {driverWalletService.formatCurrency(item.net_amount)}
              </Text>
            </View>
          )}
          {item.processed_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Procesado</Text>
              <Text style={styles.detailValue}>{formatDate(item.processed_at)}</Text>
            </View>
          )}
          {item.failure_reason && (
            <View style={styles.failureRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.failureText}>{item.failure_reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color={'rgba(255,255,255,0.55)'} />
      <Text style={styles.emptyTitle}>Sin retiros</Text>
      <Text style={styles.emptyText}>
        Aun no has realizado ningun retiro de ganancias
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('DriverWithdraw')}
      >
        <Text style={styles.emptyButtonText}>Hacer mi primer retiro</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de retiros</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id}
        renderItem={renderWithdrawalItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
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
  listContent: {
    padding: SIZES.screenPadding,
    flexGrow: 1,
  },
  withdrawalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawalInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  withdrawalAmount: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  withdrawalDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  withdrawalDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SIZES.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  detailLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: SIZES.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  netAmount: {
    color: COLORS.success,
    fontWeight: '600',
  },
  failureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    padding: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.sm,
  },
  failureText: {
    fontSize: SIZES.small,
    color: COLORS.error,
    marginLeft: SIZES.xs,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xxl,
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
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  emptyButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footerLoader: {
    paddingVertical: SIZES.md,
    alignItems: 'center',
  },
});

export default DriverWithdrawalsScreen;
