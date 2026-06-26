import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, MapViewWrapper } from '../../components/common';
import { rideService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// SelectServiceScreen - Confirmar viaje Vuelta Segura
const SelectServiceScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { origin, destination, distance, duration, price, carModel, transmission, isChofer } = route.params || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');
  const [loading, setLoading] = useState(false);

  // Precio del viaje (viene de la pantalla anterior o se calcula)
  const tripPrice = price || 10500;

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const paymentMethod = selectedPaymentMethod;
      const paymentMethodId = null;

      // Crear el viaje en el backend
      const result = await rideService.createRide({
        serviceType: isChofer ? 'chofer' : 'vuelta-segura',
        pickup: {
          address: origin?.address,
          coordinates: origin?.coordinates,
        },
        dropoff: {
          address: destination?.address,
          coordinates: destination?.coordinates,
        },
        estimatedPrice: tripPrice,
        distance,
        duration,
        paymentMethod,
        paymentMethodId,
      });

      if (result.success && result.ride) {
        // Navegar a la pantalla de viaje activo con el rideId
        navigation.navigate('TripActive', {
          rideId: result.ride.id,
          origin,
          destination,
          service: isChofer
            ? { id: 'chofer', name: 'Chofer', price: tripPrice }
            : { id: 'vuelta-segura', name: 'Vuelta Segura', price: tripPrice },
          paymentMethod,
          carModel,
          transmission,
        });
      } else {
        Alert.alert('Error', result.message || 'No se pudo crear el viaje');
      }
    } catch (error) {
      console.error('Error creating ride:', error);
      Alert.alert('Error', 'No se pudo solicitar el viaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewWrapper
          origin={
            origin?.coordinates
              ? {
                  lat: origin.coordinates.lat,
                  lng: origin.coordinates.lng,
                  title: 'Origen',
                  description: origin.address,
                }
              : null
          }
          destination={
            destination?.coordinates
              ? {
                  lat: destination.coordinates.lat,
                  lng: destination.coordinates.lng,
                  title: 'Destino',
                  description: destination.address,
                }
              : null
          }
          showRoute={!!(origin?.coordinates && destination?.coordinates)}
        />
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Confirmar viaje</Text>

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Total a pagar</Text>
              <Text style={styles.priceValue}>${tripPrice?.toLocaleString('es-AR')}</Text>
              {duration && (
                <Text style={styles.durationText}>Duración estimada: {duration} min</Text>
              )}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Método de pago</Text>

            <>
                {/* Efectivo */}
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === 'cash' && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethod('cash')}
                  activeOpacity={0.7}
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
                  activeOpacity={0.7}
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
          </View>

          {/* Route Info */}
          {distance && duration && (
            <View style={styles.routeInfo}>
              <View style={styles.routeItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.routeText}>{duration} min</Text>
              </View>
              <View style={styles.routeDot} />
              <View style={styles.routeItem}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.routeText}>{distance} km</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.buttonContainer, { bottom: insets.bottom }]}>
          <Button
            title="Solicitar viaje"
            onPress={handleConfirm}
            loading={loading}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: SIZES.screenPadding,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.md,
  },
  mapContainer: {
    height: '40%',
    backgroundColor: COLORS.backgroundTertiary,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    marginTop: -SIZES.lg,
    paddingTop: SIZES.sm,
    ...SHADOWS.lg,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SIZES.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 100,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.lg,
  },

  // Price Card
  priceCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
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

  // Payment
  paymentSection: {
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  paymentTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
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

  // Route Info
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: SIZES.md,
  },
  routeText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },

  // Button
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});

export default SelectServiceScreen;
