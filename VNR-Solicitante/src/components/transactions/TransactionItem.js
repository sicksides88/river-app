import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { paymentService } from '../../services';

/**
 * Componente para mostrar un item de transaccion en listas
 */
const TransactionItem = ({ transaction, onPress, showBalance = false }) => {
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
      deposit: 'Recarga',
      withdrawal: 'Retiro',
      payment: 'Pago',
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isIncome = ['deposit', 'refund', 'bonus'].includes(transaction.type);
  const amount = Math.abs(parseFloat(transaction.amount));
  const color = getTransactionColor(transaction.type);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Icono */}
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={getTransactionIcon(transaction.type)} size={24} color={color} />
      </View>

      {/* Informacion */}
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text style={styles.typeLabel}>{getTransactionLabel(transaction.type)}</Text>
          <Text style={[styles.amount, { color }]}>
            {isIncome ? '+' : '-'}
            {paymentService.formatCurrency(amount)}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || 'Sin descripcion'}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.date}>{formatDate(transaction.created_at)}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusDot, { backgroundColor: getStatusColor(transaction.status) }]}
            />
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {getStatusLabel(transaction.status)}
            </Text>
          </View>
        </View>

        {/* Mostrar saldo si esta habilitado */}
        {showBalance && transaction.balance_after !== undefined && (
          <Text style={styles.balanceText}>
            Saldo: {paymentService.formatCurrency(transaction.balance_after)}
          </Text>
        )}
      </View>

      {/* Flecha */}
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: SIZES.md,
    marginRight: SIZES.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  amount: {
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  description: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: SIZES.small,
  },
  balanceText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default TransactionItem;
