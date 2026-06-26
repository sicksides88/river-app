import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { transactionService, paymentService } from '../../services';
import { TransactionItem, TransactionFilters } from '../../components/transactions';

const TransactionsScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: null,
    dateTo: null,
    minAmount: null,
    maxAmount: null,
  });

  const loadTransactions = async (pageNum = 1, isRefresh = false) => {
    try {
      const params = {
        page: pageNum,
        limit: 20,
        ...buildFilterParams(),
      };

      const response = await transactionService.getTransactions(params);

      if (response.success) {
        const newTransactions = response.transactions || [];

        if (isRefresh || pageNum === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions((prev) => [...prev, ...newTransactions]);
        }

        setHasMore(response.hasMore || newTransactions.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await transactionService.getSummary('month');
      if (response.success) {
        setSummary(response.summary);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const buildFilterParams = () => {
    const params = {};

    if (filters.type && filters.type !== 'all') {
      params.type = filters.type;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      params.dateTo = filters.dateTo;
    }
    if (filters.minAmount) {
      params.minAmount = filters.minAmount;
    }
    if (filters.maxAmount) {
      params.maxAmount = filters.maxAmount;
    }

    return params;
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadTransactions(1, true);
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions(1, true);
    loadSummary();
  }, [filters]);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadTransactions(page + 1);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTransactionPress = (transaction) => {
    navigation.navigate('TransactionDetail', { transactionId: transaction.id });
  };

  const handleExport = async () => {
    try {
      Alert.alert(
        'Exportar Transacciones',
        'Selecciona el formato de exportacion',
        [
          {
            text: 'CSV',
            onPress: async () => {
              const result = await transactionService.exportTransactions({
                format: 'csv',
                ...buildFilterParams(),
              });
              Alert.alert('Exito', 'Archivo CSV generado correctamente');
            },
          },
          {
            text: 'JSON',
            onPress: async () => {
              const result = await transactionService.exportTransactions({
                format: 'json',
                ...buildFilterParams(),
              });
              Alert.alert('Exito', 'Archivo JSON generado correctamente');
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar las transacciones');
    }
  };

  const renderTransaction = ({ item }) => (
    <TransactionItem
      transaction={item}
      onPress={() => handleTransactionPress(item)}
      showBalance={false}
    />
  );

  const renderHeader = () => (
    <>
      {/* Resumen del mes */}
      {summary && showSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Resumen del mes</Text>
            <TouchableOpacity onPress={() => setShowSummary(false)}>
              <Ionicons name="chevron-up" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                +{paymentService.formatCurrency(summary.totalDeposits + summary.totalRefunds)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={[styles.summaryValue, { color: COLORS.error }]}>
                -{paymentService.formatCurrency(summary.totalPayments + summary.totalWithdrawals)}
              </Text>
            </View>
          </View>

          <View style={styles.netBalanceRow}>
            <Text style={styles.netLabel}>Balance neto</Text>
            <Text
              style={[
                styles.netValue,
                { color: summary.netBalance >= 0 ? COLORS.success : COLORS.error },
              ]}
            >
              {summary.netBalance >= 0 ? '+' : ''}
              {paymentService.formatCurrency(summary.netBalance)}
            </Text>
          </View>

          <Text style={styles.summaryCount}>
            {summary.transactionCount} transacciones este mes
          </Text>
        </View>
      )}

      {/* Boton para mostrar resumen */}
      {summary && !showSummary && (
        <TouchableOpacity style={styles.showSummaryButton} onPress={() => setShowSummary(true)}>
          <Ionicons name="stats-chart" size={16} color={COLORS.primary} />
          <Text style={styles.showSummaryText}>Ver resumen del mes</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={'rgba(255,255,255,0.55)'} />
      <Text style={styles.emptyTitle}>No hay transacciones</Text>
      <Text style={styles.emptyText}>
        {filters.type !== 'all' || filters.status !== 'all'
          ? 'No se encontraron transacciones con los filtros seleccionados'
          : 'Aun no tienes movimientos en tu billetera'}
      </Text>
      {(filters.type !== 'all' || filters.status !== 'all') && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() =>
            setFilters({
              type: 'all',
              status: 'all',
              dateFrom: null,
              dateTo: null,
              minAmount: null,
              maxAmount: null,
            })
          }
        >
          <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Historial</Text>

        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Ionicons name="download-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <TransactionFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Lista de transacciones */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando transacciones...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
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
  exportButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.sm,
    color: 'rgba(255,255,255,0.72)',
  },
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    flexGrow: 1,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  summaryTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderLight,
  },
  summaryLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  netBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  netLabel: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  netValue: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  summaryCount: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  showSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  showSummaryText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginHorizontal: SIZES.xs,
  },
  footerLoader: {
    paddingVertical: SIZES.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xl * 2,
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
  },
  clearFiltersButton: {
    marginTop: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
  },
  clearFiltersText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default TransactionsScreen;
