import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import orderService from '../../services/order.service';

const SHIPPING_COST = 5000;

const CheckoutScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { product, quantity = 1, mode = 'buy', coupon } = route.params || {};

  const unitPrice = mode === 'rent' ? (product?.pricePerHour || 0) : (product?.price || 0);
  const subtotal = unitPrice * quantity;
  const discount = coupon?.discount || 0;
  const total = subtotal - discount + SHIPPING_COST;

  // Form state
  const [formData, setFormData] = useState({
    shipping_street: '',
    shipping_number: '',
    shipping_floor: '',
    shipping_postal_code: '',
    shipping_neighborhood: '',
    shipping_city: '',
    shipping_province: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.shipping_street.trim()) {
      errors.shipping_street = 'La calle es requerida';
    }
    if (!formData.shipping_number.trim()) {
      errors.shipping_number = 'El número es requerido';
    }
    if (!formData.shipping_postal_code.trim()) {
      errors.shipping_postal_code = 'El código postal es requerido';
    }
    if (!formData.shipping_city.trim()) {
      errors.shipping_city = 'La ciudad es requerida';
    }
    if (!formData.shipping_province.trim()) {
      errors.shipping_province = 'La provincia es requerida';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPrice = (price) => {
    return '$' + price.toLocaleString('es-AR');
  };

  const handleConfirmOrder = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const orderData = {
        items: [{ product_id: product?.id, quantity }],
        coupon_code: coupon?.code || undefined,
        shipping_street: formData.shipping_street.trim(),
        shipping_number: formData.shipping_number.trim(),
        shipping_floor: formData.shipping_floor.trim() || undefined,
        shipping_postal_code: formData.shipping_postal_code.trim(),
        shipping_neighborhood: formData.shipping_neighborhood.trim() || undefined,
        shipping_city: formData.shipping_city.trim(),
        shipping_province: formData.shipping_province.trim(),
        shipping_cost: SHIPPING_COST,
        notes: formData.notes.trim() || undefined,
      };

      await orderService.createOrder(orderData);
      Alert.alert('Orden confirmada', 'Tu orden ha sido creada exitosamente.', [
        { text: 'OK', onPress: () => navigation.navigate('Marketplace') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la orden. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Summary */}
          <View style={styles.card}>
            <View style={styles.productRow}>
              {product?.image ? (
                <Image source={product.image} style={styles.productImage} resizeMode="contain" />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={32} color={COLORS.textMuted} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product?.name || 'Producto'}</Text>
                <Text style={styles.productMeta}>Cantidad: {quantity}</Text>
                <Text style={styles.productPrice}>{formatPrice(unitPrice)} c/u</Text>
              </View>
            </View>
          </View>

          {/* Shipping Data */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos de envío</Text>
            <Input
              label="Calle"
              placeholder="Nombre de la calle"
              value={formData.shipping_street}
              onChangeText={(v) => handleChange('shipping_street', v)}
              error={formErrors.shipping_street}
            />
            <View style={styles.rowFields}>
              <View style={styles.fieldHalf}>
                <Input
                  label="Número"
                  placeholder="Ej: 1234"
                  value={formData.shipping_number}
                  onChangeText={(v) => handleChange('shipping_number', v)}
                  error={formErrors.shipping_number}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Input
                  label="Piso/Depto (opcional)"
                  placeholder="Ej: 3B"
                  value={formData.shipping_floor}
                  onChangeText={(v) => handleChange('shipping_floor', v)}
                />
              </View>
            </View>
            <Input
              label="Barrio (opcional)"
              placeholder="Barrio"
              value={formData.shipping_neighborhood}
              onChangeText={(v) => handleChange('shipping_neighborhood', v)}
            />
            <Input
              label="Ciudad"
              placeholder="Ciudad"
              value={formData.shipping_city}
              onChangeText={(v) => handleChange('shipping_city', v)}
              error={formErrors.shipping_city}
            />
            <View style={styles.rowFields}>
              <View style={styles.fieldHalf}>
                <Input
                  label="Provincia"
                  placeholder="Provincia"
                  value={formData.shipping_province}
                  onChangeText={(v) => handleChange('shipping_province', v)}
                  error={formErrors.shipping_province}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Input
                  label="Código postal"
                  placeholder="Ej: 1000"
                  value={formData.shipping_postal_code}
                  onChangeText={(v) => handleChange('shipping_postal_code', v)}
                  error={formErrors.shipping_postal_code}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notas (opcional)</Text>
            <Input
              placeholder="Indicaciones adicionales para la entrega..."
              value={formData.notes}
              onChangeText={(v) => handleChange('notes', v)}
              multiline
              numberOfLines={3}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Price Breakdown */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Descuento</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>-{formatPrice(discount)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Envío</Text>
              <Text style={styles.priceValue}>{formatPrice(SHIPPING_COST)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <Button
          title={submitting ? '' : 'Confirmar orden'}
          onPress={handleConfirmOrder}
          disabled={submitting}
          style={styles.confirmButton}
        />
        {submitting && (
          <ActivityIndicator
            style={styles.submitSpinner}
            size="small"
            color={COLORS.white}
          />
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.screenPadding,
    paddingBottom: 120,
    gap: SIZES.md,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.cardPadding,
    ...SHADOWS.sm,
  },

  // Product Summary
  productRow: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: SIZES.radius,
  },
  productImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  productMeta: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Form rows
  rowFields: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  fieldHalf: {
    flex: 1,
  },

  // Sections
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },

  // Price Breakdown
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  priceLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  discountValue: {
    color: COLORS.success,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.sm,
  },
  totalLabel: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Bottom
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    paddingBottom: SIZES.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  confirmButton: {
    width: '100%',
  },
  submitSpinner: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default CheckoutScreen;
