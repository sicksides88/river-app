import React, { useState, useCallback } from 'react';
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

const CARD_ICONS = {
  visa: 'card',
  mastercard: 'card',
  amex: 'card',
  diners: 'card',
  discover: 'card',
  default: 'card-outline',
};

const CARD_COLORS = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  diners: '#0079BE',
  discover: '#FF6000',
  default: COLORS.text,
};

const PaymentMethodsScreen = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPaymentMethods = async () => {
    try {
      const response = await walletService.getPaymentMethods();
      if (response.success) {
        setPaymentMethods(response.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPaymentMethods();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentMethods();
  };

  const handleSetDefault = async (methodId) => {
    try {
      // Optimistic UI update
      setPaymentMethods((prev) =>
        prev.map((m) => ({
          ...m,
          isDefault: m.id === methodId,
        }))
      );

      const response = await walletService.setDefaultPaymentMethod(methodId);
      if (!response.success) {
        // Revert on failure
        fetchPaymentMethods();
        Alert.alert('Error', response.message || 'No se pudo establecer como predeterminado');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      fetchPaymentMethods();
      Alert.alert('Error', 'No se pudo establecer como predeterminado');
    }
  };

  const handleDelete = (method) => {
    Alert.alert(
      'Eliminar método de pago',
      `¿Estás seguro de eliminar la tarjeta terminada en ${method.cardLastFour}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => confirmDelete(method.id),
        },
      ]
    );
  };

  const confirmDelete = async (methodId) => {
    setDeletingId(methodId);
    try {
      const response = await walletService.deletePaymentMethod(methodId);
      if (response.success) {
        setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
      } else {
        Alert.alert('Error', response.message || 'No se pudo eliminar el método de pago');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      Alert.alert('Error', 'No se pudo eliminar el método de pago');
    } finally {
      setDeletingId(null);
    }
  };

  const getCardBrandName = (brand) => {
    const brands = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      diners: 'Diners Club',
      discover: 'Discover',
    };
    return brands[brand?.toLowerCase()] || brand || 'Tarjeta';
  };

  const renderPaymentMethod = ({ item }) => {
    const brand = item.cardBrand?.toLowerCase() || 'default';
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.methodCard}>
        <View style={styles.methodHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: CARD_COLORS[brand] || CARD_COLORS.default }]}>
            <Ionicons name={CARD_ICONS[brand] || CARD_ICONS.default} size={20} color={COLORS.white} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>
              {getCardBrandName(item.cardBrand)} •••• {item.cardLastFour}
            </Text>
            <Text style={styles.methodSubtitle}>
              Vence {String(item.cardExpiryMonth).padStart(2, '0')}/{String(item.cardExpiryYear).slice(-2)}
            </Text>
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Predeterminada</Text>
            </View>
          )}
        </View>

        <View style={styles.methodActions}>
          {!item.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(item.id)}
            >
              <Text style={styles.actionButtonText}>Establecer como predeterminada</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="card-outline" size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No tienes métodos de pago</Text>
      <Text style={styles.emptySubtitle}>
        Agrega una tarjeta para pagar tus viajes y envíos de forma rápida y segura
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddPaymentMethod')}
      >
        <Text style={styles.emptyButtonText}>Agregar método de pago</Text>
      </TouchableOpacity>
    </View>
  );

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
        <Text style={styles.headerTitle}>Métodos de pago</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            paymentMethods.length > 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddPaymentMethod')}
              >
                <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Agregar método de pago</Text>
              </TouchableOpacity>
            ) : null
          }
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
  placeholder: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
    flexGrow: 1,
  },
  methodCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  methodTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  methodSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: COLORS.white + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  defaultBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.primary,
  },
  methodActions: {
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl,
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  emptyButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
  },
  emptyButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default PaymentMethodsScreen;
