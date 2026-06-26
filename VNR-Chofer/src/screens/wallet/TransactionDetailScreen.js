import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { transactionService, paymentService } from '../../services';

const TransactionDetailScreen = ({ navigation, route }) => {
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionService.getTransaction(transactionId);

      if (response.success) {
        setTransaction(response.transaction);
      } else {
        setError('No se pudo cargar la transaccion');
      }
    } catch (err) {
      console.error('Error loading transaction:', err);
      setError('Error al cargar los detalles de la transaccion');
    } finally {
      setLoading(false);
    }
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

  const getTransactionLabel = (type) => {
    const labels = {
      deposit: 'Recarga de saldo',
      withdrawal: 'Retiro de saldo',
      payment: 'Pago de servicio',
      refund: 'Reembolso',
      bonus: 'Bonificacion',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: COLORS.warning,
      completed: COLORS.success,
      failed: COLORS.error,
      cancelled: COLORS.textMuted,
    };
    return colors[status] || COLORS.text;
  };

  const getReferenceTypeLabel = (type) => {
    const labels = {
      ride: 'Viaje',
      delivery: 'Envio',
      mercadopago: 'MercadoPago',
      bank_transfer: 'Transferencia bancaria',
      manual: 'Manual',
      promotion: 'Promocion',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    if (!transaction) return;

    const isIncome = ['deposit', 'refund', 'bonus'].includes(transaction.type);
    const amount = Math.abs(parseFloat(transaction.amount));

    const message = `Transaccion VNR
Tipo: ${getTransactionLabel(transaction.type)}
Monto: ${isIncome ? '+' : '-'}${paymentService.formatCurrency(amount)}
Fecha: ${formatDate(transaction.created_at)}
Estado: ${getStatusLabel(transaction.status)}
ID: ${transaction.id}`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Transaccion no encontrada'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTransaction}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isIncome = ['deposit', 'refund', 'bonus'].includes(transaction.type);
  const amount = Math.abs(parseFloat(transaction.amount));
  const color = getTransactionColor(transaction.type);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de transaccion</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Monto y tipo */}
        <View style={styles.amountCard}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={getTransactionIcon(transaction.type)} size={40} color={color} />
          </View>

          <Text style={styles.typeLabel}>{getTransactionLabel(transaction.type)}</Text>

          <Text style={[styles.amount, { color }]}>
            {isIncome ? '+' : '-'}
            {paymentService.formatCurrency(amount)}
          </Text>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(transaction.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {getStatusLabel(transaction.status)}
            </Text>
          </View>
        </View>

        {/* Informacion general */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacion</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{formatDate(transaction.created_at)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Descripcion</Text>
              <Text style={styles.infoValue}>{transaction.description || 'Sin descripcion'}</Text>
            </View>

            {transaction.reference_type && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo de referencia</Text>
                  <Text style={styles.infoValue}>
                    {getReferenceTypeLabel(transaction.reference_type)}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Saldo anterior</Text>
              <Text style={styles.infoValue}>
                {paymentService.formatCurrency(transaction.balance_before)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Saldo posterior</Text>
              <Text style={styles.infoValue}>
                {paymentService.formatCurrency(transaction.balance_after)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detalles del viaje (si aplica) */}
        {transaction.referenceDetails && transaction.reference_type === 'ride' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del viaje</Text>

            <View style={styles.infoCard}>
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Origen</Text>
                  <Text style={styles.locationAddress}>
                    {transaction.referenceDetails.origin_address}
                  </Text>
                </View>
              </View>

              <View style={styles.locationLine} />

              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Destino</Text>
                  <Text style={styles.locationAddress}>
                    {transaction.referenceDetails.destination_address}
                  </Text>
                </View>
              </View>

              {transaction.referenceDetails.distance && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distancia</Text>
                    <Text style={styles.infoValue}>
                      {(transaction.referenceDetails.distance / 1000).toFixed(1)} km
                    </Text>
                  </View>
                </>
              )}

              {transaction.referenceDetails.driver && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Conductor</Text>
                    <Text style={styles.infoValue}>
                      {transaction.referenceDetails.driver.first_name}{' '}
                      {transaction.referenceDetails.driver.last_name}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Detalles del envio (si aplica) */}
        {transaction.referenceDetails && transaction.reference_type === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del envio</Text>

            <View style={styles.infoCard}>
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Recogida</Text>
                  <Text style={styles.locationAddress}>
                    {transaction.referenceDetails.pickup_address}
                  </Text>
                </View>
              </View>

              <View style={styles.locationLine} />

              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Entrega</Text>
                  <Text style={styles.locationAddress}>
                    {transaction.referenceDetails.delivery_address}
                  </Text>
                </View>
              </View>

              {transaction.referenceDetails.package_description && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Paquete</Text>
                    <Text style={styles.infoValue}>
                      {transaction.referenceDetails.package_description}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Informacion de pago (si aplica) */}
        {transaction.payments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacion de pago</Text>

            <View style={styles.infoCard}>
              {transaction.payments.payment_method && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Metodo de pago</Text>
                  <Text style={styles.infoValue}>{transaction.payments.payment_method}</Text>
                </View>
              )}

              {transaction.payments.mp_payment_id && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID MercadoPago</Text>
                    <Text style={styles.infoValueSmall}>{transaction.payments.mp_payment_id}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ID de transaccion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificador</Text>

          <View style={styles.infoCard}>
            <Text style={styles.transactionId}>{transaction.id}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },
  errorText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: SIZES.md,
  },
  retryButton: {
    marginTop: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
  },
  retryButtonText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  amountCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.screenPadding,
    marginTop: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  typeLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: SIZES.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusFull,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.xs,
  },
  statusText: {
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  section: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.screenPadding,
  },
  sectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  infoLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: SIZES.md,
  },
  infoValueSmall: {
    fontSize: SIZES.small,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: SIZES.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginTop: 4,
    marginRight: SIZES.sm,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.borderLight,
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  transactionId: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SIZES.xl * 2,
  },
});

export default TransactionDetailScreen;
