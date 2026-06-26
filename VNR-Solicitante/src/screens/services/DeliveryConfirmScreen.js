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
import { CommonActions } from '@react-navigation/native';
import { Button, Card } from '../../components/common';
import { deliveryService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';

const DeliveryConfirmScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    pickup,
    delivery,
    pickupAddress: pickupAddr,
    deliveryAddress: deliveryAddr,
    packageDescription,
    packageType,
    description,
    weight,
    dimensions,
    helpers,
    price,
    distance,
    type,
    vehicleType,
  } = route.params || {};

  // Soportar ambos formatos de parámetros
  const pickupAddress = pickup?.address || pickupAddr;
  const deliveryAddress = delivery?.address || deliveryAddr;
  const pickupCoords = pickup?.coordinates || null;
  const deliveryCoords = delivery?.coordinates || null;

  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');
  const isFlete = type === 'flete';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const paymentMethod = selectedPaymentMethod;
      const paymentMethodId = null;

      // Crear el envío/flete en el servidor
      const deliveryData = {
        serviceType: isFlete ? 'flete' : 'envio',
        deliveryType: 'enviar',
        pickup: {
          address: pickupAddress,
          coordinates: pickupCoords,
        },
        dropoff: {
          address: deliveryAddress,
          coordinates: deliveryCoords,
        },
        packageDetails: {
          description: packageDescription || description,
          weight: weight ? parseFloat(weight) : null,
          dimensions: dimensions || null,
          vehicleType: isFlete ? vehicleType : null,
          helpers: isFlete && helpers ? parseInt(helpers) : 0,
        },
        estimatedPrice: price,
        distance,
        paymentMethod,
        paymentMethodId,
      };

      const response = await deliveryService.createDelivery(deliveryData);

      if (response.success) {
        // Navegar a pantalla de búsqueda de conductor (dentro de HomeTab para mostrar navbar)
        const navDeliveryData = {
          id: response.delivery?.id,
          serviceType: isFlete ? 'flete' : 'envio',
          pickup: {
            address: pickupAddress,
            lat: pickupCoords?.lat,
            lng: pickupCoords?.lng,
          },
          dropoff: {
            address: deliveryAddress,
            lat: deliveryCoords?.lat,
            lng: deliveryCoords?.lng,
          },
          estimatedPrice: price,
          distance,
          packageDescription: packageDescription || description,
          packageWeight: weight,
          packageDimensions: dimensions,
        };

        // Cerrar el modal de Services y navegar a DeliverySearching en HomeTab
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                state: {
                  routes: [
                    {
                      name: 'HomeTab',
                      state: {
                        routes: [
                          { name: 'HomeMain' },
                          {
                            name: 'DeliverySearching',
                            params: {
                              fromConfirm: true,
                              delivery: navDeliveryData,
                              paymentMethod,
                            },
                          },
                        ],
                        index: 1,
                      },
                    },
                  ],
                  index: 0,
                },
              },
            ],
          })
        );
      } else {
        Alert.alert('Error', response.message || 'No pudimos procesar tu solicitud.');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      Alert.alert('Error', error.response?.data?.message || 'No pudimos procesar tu solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>
            {isFlete ? 'Resumen del Flete' : 'Resumen del Envío'}
          </Text>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={COLORS.success} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Retiro</Text>
                <Text style={styles.locationText}>{pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.locationLine} />

            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={COLORS.error} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Entrega</Text>
                <Text style={styles.locationText}>{deliveryAddress}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Detalles</Text>

          {(packageDescription || description) && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Descripción</Text>
                <Text style={styles.detailText}>
                  {packageDescription || description}
                </Text>
              </View>
            </View>
          )}

          {dimensions && dimensions.height ? (
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Dimensiones</Text>
                <Text style={styles.detailText}>
                  {dimensions.height} x {dimensions.width} x {dimensions.depth} cm
                </Text>
              </View>
            </View>
          ) : null}

          {weight ? (
            <View style={styles.detailRow}>
              <Ionicons name="scale-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Peso</Text>
                <Text style={styles.detailText}>{weight} kg</Text>
              </View>
            </View>
          ) : null}

          {isFlete && Number(helpers) > 0 ? (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color={COLORS.gray} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ayudantes</Text>
                <Text style={styles.detailText}>{helpers} persona(s)</Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Price */}
        <Card style={styles.priceCard}>
          <View style={styles.priceContent}>
            <Text style={styles.priceLabel}>Total a Pagar</Text>
            <Text style={styles.priceValue}>${price}</Text>
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
                <Text style={styles.paymentText}>Efectivo</Text>
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
                <Text style={styles.paymentText}>Tarjeta / MercadoPago</Text>
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
            <Text style={styles.infoText}>
              {isFlete ? 'Carga asegurada' : 'Paquete asegurado'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="navigate" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>Seguimiento en tiempo real</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <Button
          title={isFlete ? 'Confirmar Flete' : 'Confirmar Envío'}
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
  // Línea punteada como en Figma
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
  detailsCard: {
    padding: SIZES.lg,
    marginTop: SIZES.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  detailContent: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.black,
  },
  // Card de precio minimalista
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
  paymentCard: {
    padding: SIZES.lg,
    marginTop: SIZES.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTint,
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
  paymentText: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  paymentSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: SIZES.sm,
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
    color: 'rgba(255,255,255,0.72)',
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

export default DeliveryConfirmScreen;
