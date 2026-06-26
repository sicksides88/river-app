import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components/common';
import { rideService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const RideConfirmScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { origin, destination, price, duration } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // En producción, esto crearía el viaje en el servidor
      // await rideService.createRide({ origin, destination, price });

      Alert.alert(
        'Viaje Solicitado',
        'Estamos buscando un conductor cerca tuyo. Te notificaremos cuando acepte el viaje.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No pudimos procesar tu solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con botón atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar viaje</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Trip Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Resumen del Viaje</Text>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={COLORS.success} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Origen</Text>
                <Text style={styles.locationText}>{origin}</Text>
              </View>
            </View>

            <View style={styles.locationLine} />

            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={COLORS.error} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destino</Text>
                <Text style={styles.locationText}>{destination}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Price */}
        <Card style={styles.priceCard}>
          <View style={styles.priceContent}>
            <Text style={styles.priceLabel}>Total a Pagar</Text>
            <Text style={styles.priceValue}>${price}</Text>
            {duration && (
              <Text style={styles.durationText}>Duración estimada: {duration} min</Text>
            )}
          </View>
        </Card>

        {/* Payment Method */}
        <Card style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>

          <>
              {/* Efectivo */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'cash' && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('cash')}
              >
                <View style={[styles.paymentIconContainer, { backgroundColor: '#22c55e20' }]}>
                  <Ionicons name="cash" size={20} color="#22c55e" />
                </View>
                <Text style={styles.paymentOptionText}>Efectivo</Text>
                {selectedPaymentMethod === 'cash' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>

              {/* Tarjeta / MercadoPago (ambos usan Checkout Pro) */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'mercadopago' && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('mercadopago')}
              >
                <View style={[styles.paymentIconContainer, { backgroundColor: '#3b82f620' }]}>
                  <Ionicons name="card" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.paymentOptionText}>Tarjeta / MercadoPago</Text>
                {selectedPaymentMethod === 'mercadopago' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </>
        </Card>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.success} />
            <Text style={styles.infoText}>Viaje asegurado</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>Seguimiento en tiempo real</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="call" size={18} color={COLORS.warning} />
            <Text style={styles.infoText}>Podrás contactar al conductor</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <Button
          title="Confirmar Viaje"
          onPress={handleConfirm}
          loading={loading}
          fullWidth
        />
        <Button
          title="Cancelar"
          onPress={() => navigation.goBack()}
          variant="outline"
          fullWidth
          style={styles.cancelButton}
        />
      </View>
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
    paddingVertical: SIZES.sm,
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
    padding: SIZES.md,
    paddingBottom: 180,
  },
  summaryCard: {
    padding: SIZES.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.md,
  },
  locationContainer: {
    paddingLeft: SIZES.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  locationLine: {
    width: 0,
    height: 24,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginLeft: 11,
    marginVertical: SIZES.xs,
  },
  locationInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  priceCard: {
    marginTop: SIZES.md,
    padding: SIZES.lg,
    backgroundColor: COLORS.white,
  },
  priceContent: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SIZES.xs,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: SIZES.sm,
  },
  paymentCard: {
    padding: SIZES.lg,
    marginTop: SIZES.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTextContainer: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  paymentOptionText: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: 16,
    color: COLORS.black,
  },
  paymentSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SIZES.sm,
  },
  mpLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00b1ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpLogoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    marginTop: SIZES.xs,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SIZES.xs,
  },
  infoSection: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  infoText: {
    marginLeft: SIZES.sm,
    fontSize: 14,
    color: COLORS.gray,
  },
  // Botón inferior con borde (sin sombras, minimalista)
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    marginTop: SIZES.sm,
  },
});

export default RideConfirmScreen;
