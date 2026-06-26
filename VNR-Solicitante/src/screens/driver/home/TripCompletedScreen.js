import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { useSocketContext } from '../../../context/SocketContext';

const TripCompletedScreen = ({ navigation, route }) => {
  const { trip, isDelivery, paymentPending } = route.params || {};
  const { socket } = useSocketContext();

  const [isPendingPayment, setIsPendingPayment] = useState(!!paymentPending);
  const [showContinueButton, setShowContinueButton] = useState(false);

  // ID del servicio (ride_id o delivery_id según el tipo)
  const serviceId = trip?.deliveryId || trip?.id;

  // Listen for payment:received socket event
  useEffect(() => {
    if (!isPendingPayment || !socket) return;

    const unsub = socket.on('payment:received', (data) => {
      if (data.serviceId === serviceId) {
        setIsPendingPayment(false);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isPendingPayment, socket, serviceId]);

  // Show "continue anyway" button after 30s
  useEffect(() => {
    if (!isPendingPayment) return;

    const timer = setTimeout(() => {
      setShowContinueButton(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [isPendingPayment]);

  // Obtener el precio del viaje (priorizar actual_price que incluye descuento)
  const tripPrice = trip?.actualPrice || trip?.actual_price || trip?.estimatedPrice || trip?.price || 0;
  const originalPrice = trip?.estimatedPrice || trip?.price || tripPrice;
  const cashDiscountPercentage = trip?.cashDiscountPercentage || 0;
  const cashDiscountAmount = trip?.cashDiscountAmount || 0;
  const hasDiscount = cashDiscountPercentage > 0 && cashDiscountAmount > 0;

  // Obtener direcciones
  const pickupAddress = trip?.pickup?.address || trip?.origin?.address || 'Punto de retiro';
  const dropoffAddress = trip?.dropoff?.address || trip?.destination?.address || 'Punto de entrega';

  // Nombre del cliente
  const clientName = trip?.user
    ? `${trip.user.nombre || ''} ${trip.user.apellido || ''}`.trim() || (isDelivery ? 'Cliente' : 'Pasajero')
    : (isDelivery ? 'Cliente' : 'Pasajero');

  // Obtener método de pago
  const getPaymentMethodLabel = () => {
    const method = trip?.payment_method || trip?.paymentMethod || 'cash';
    switch (method.toLowerCase()) {
      case 'card':
      case 'tarjeta':
        return 'Tarjeta';
      case 'mercadopago':
      case 'mercado_pago':
        return 'Mercado Pago';
      case 'cash':
      case 'efectivo':
      default:
        return 'Efectivo';
    }
  };

  const getPaymentIcon = () => {
    const method = trip?.payment_method || trip?.paymentMethod || 'cash';
    switch (method.toLowerCase()) {
      case 'card':
      case 'tarjeta':
        return 'card-outline';
      case 'mercadopago':
      case 'mercado_pago':
        return 'phone-portrait-outline';
      case 'cash':
      case 'efectivo':
      default:
        return 'cash-outline';
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DriverHome' }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.successIconContainer}>
          <View style={[
            styles.successIconCircle,
            isPendingPayment && styles.pendingIconCircle,
          ]}>
            <Ionicons
              name={isPendingPayment ? 'time-outline' : 'checkmark'}
              size={60}
              color={COLORS.white}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isPendingPayment
            ? 'Pago en progreso'
            : isDelivery ? 'Envío completado' : 'Viaje completado'
          }
        </Text>
        <Text style={styles.subtitle}>
          {isPendingPayment
            ? 'Esperando confirmación del pago del cliente...'
            : isDelivery
              ? 'El paquete fue entregado exitosamente'
              : 'El pasajero llegó a su destino'
          }
        </Text>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Ganancia del viaje</Text>
          <Text style={styles.earningsAmount}>
            {isPendingPayment ? '$--' : `$${tripPrice.toLocaleString('es-AR')}`}
          </Text>
          <View style={styles.earningsNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.earningsNoteText}>
              {isPendingPayment ? 'Confirmando...' : 'Disponible en 72 horas'}
            </Text>
          </View>
        </View>

        {/* Payment pending spinner */}
        {isPendingPayment && (
          <ActivityIndicator
            size="large"
            color="#f59e0b"
            style={styles.pendingSpinner}
          />
        )}

        {/* Trip Details Card - only show when payment confirmed */}
        {!isPendingPayment && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Detalle del {isDelivery ? 'envío' : 'viaje'}</Text>

            {/* Client Info */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={isDelivery ? 'cube-outline' : 'person-outline'} size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{isDelivery ? 'Cliente' : 'Pasajero'}</Text>
                <Text style={styles.detailValue}>{clientName}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Route Section */}
            <Text style={styles.routeSectionTitle}>Recorrido</Text>

            {/* Pickup */}
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View style={styles.routeDotPickup} />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Retiro</Text>
                <Text style={styles.routeAddress}>{pickupAddress}</Text>
              </View>
            </View>

            {/* Dropoff */}
            <View style={styles.routeRow}>
              <View style={styles.routeIconContainer}>
                <View style={styles.routeDotDropoff} />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeAddress}>{dropoffAddress}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Payment Info */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={getPaymentIcon()} size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pago del cliente</Text>
                {hasDiscount ? (
                  <View>
                    <Text style={styles.originalPrice}>${originalPrice.toLocaleString('es-AR')}</Text>
                    <Text style={styles.detailValue}>${tripPrice.toLocaleString('es-AR')}</Text>
                  </View>
                ) : (
                  <Text style={styles.detailValue}>${tripPrice.toLocaleString('es-AR')}</Text>
                )}
              </View>
              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>{getPaymentMethodLabel()}</Text>
              </View>
            </View>

            {/* Descuento por efectivo */}
            {hasDiscount && (
              <View style={styles.discountRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="pricetag-outline" size={20} color="#22c55e" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Descuento por pago en efectivo</Text>
                  <Text style={styles.discountValue}>-${cashDiscountAmount.toLocaleString('es-AR')} ({cashDiscountPercentage}%)</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Stats Row - only show when payment confirmed */}
        {!isPendingPayment && (trip?.distance || trip?.duration) && (
          <View style={styles.statsRow}>
            {trip?.distance && (
              <View style={styles.statItem}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.statValue}>{trip.distance} km</Text>
                <Text style={styles.statLabel}>Distancia</Text>
              </View>
            )}
            {trip?.duration && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.statValue}>{trip.duration} min</Text>
                <Text style={styles.statLabel}>Duración</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        {isPendingPayment ? (
          showContinueButton && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setIsPendingPayment(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continuar de todos modos</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Text style={styles.homeButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xxl,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  pendingIconCircle: {
    backgroundColor: '#f59e0b',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  earningsLabel: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SIZES.xs,
  },
  earningsAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  earningsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  earningsNoteText: {
    fontSize: SIZES.small,
    color: COLORS.white,
    opacity: 0.8,
    marginLeft: SIZES.xs,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  detailsTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.md,
  },
  routeSectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  routeRow: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  routeIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  routeDotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#22c55e',
    backgroundColor: 'transparent',
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  routeDotDropoff: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  routeContent: {
    flex: 1,
    paddingTop: -2,
  },
  routeLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  paymentBadge: {
    backgroundColor: '#22c55e20',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  paymentBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: '#22c55e',
  },
  originalPrice: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    marginTop: SIZES.xs,
    backgroundColor: '#22c55e10',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.sm,
  },
  discountValue: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: '#22c55e',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  homeButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pendingSpinner: {
    marginBottom: SIZES.lg,
  },
  continueButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  continueButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

export default TripCompletedScreen;
