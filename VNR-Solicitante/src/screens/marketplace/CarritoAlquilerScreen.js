import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// CarritoAlquilerScreen - Carrito de alquiler basado en Figma
const CarritoAlquilerScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Monopatín Electrico Xiaomi M365',
      pricePerHour: 1749,
      quantity: 1,
      image: null,
    },
    {
      id: '2',
      name: 'Bicicleta Electrica Bi-200',
      pricePerHour: 8210,
      quantity: 1,
      image: null,
    },
  ]);
  const [coupon, setCoupon] = useState('');
  const [hours, setHours] = useState(2);

  const formatPrice = (price) => {
    return '$' + price.toLocaleString('es-AR');
  };

  const updateQuantity = (id, delta) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.pricePerHour * item.quantity, 0);
  };

  const getTotal = () => {
    return getSubtotal() * hours;
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout', { items: cartItems, total: getTotal(), type: 'alquiler' });
  };

  const handleContinue = () => {
    navigation.goBack();
  };

  const handleApplyCoupon = () => {
    // TODO: Apply coupon logic
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View style={styles.cartItemsContainer}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              {/* Product Image */}
              <View style={styles.productImageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="bicycle-outline" size={40} color={COLORS.textMuted} />
                  </View>
                )}
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(item.pricePerHour)}</Text>

                {/* Quantity and Remove */}
                <View style={styles.quantityRow}>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, -1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Coupon Section */}
        <View style={styles.couponSection}>
          <Text style={styles.couponTitle}>¿Tenés un cupón de descuento?</Text>
          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Cupón"
              value={coupon}
              onChangeText={setCoupon}
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={styles.couponButton}
              onPress={handleApplyCoupon}
              activeOpacity={0.7}
            >
              <Text style={styles.couponButtonText}>Cargar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Resúmen de alquiler</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Productos ({cartItems.length})</Text>
            <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cantidad de horas ({hours})</Text>
            <Text style={styles.summaryValue}>{hours} horas</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <Button
          title="Finalizar alquiler"
          onPress={handleCheckout}
          fullWidth
        />
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>Continuar alquilando</Text>
        </TouchableOpacity>
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
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },

  // Cart Items
  cartItemsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  productImageContainer: {
    marginRight: SIZES.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusXs,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: SIZES.subtitle,
    color: COLORS.textMuted,
  },
  quantityText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    paddingHorizontal: SIZES.sm,
  },
  removeText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // Coupon Section
  couponSection: {
    marginBottom: SIZES.lg,
  },
  couponTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingLeft: SIZES.md,
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  couponButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusXl,
  },
  couponButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Summary Section
  summarySection: {
    marginBottom: SIZES.lg,
  },
  summaryTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  summaryLabel: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
  },
  summaryValue: {
    fontSize: SIZES.body,
    color: COLORS.white,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: SIZES.sm,
  },
  totalLabel: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  totalValue: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Bottom Container
  bottomContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    paddingBottom: SIZES.xl,
    gap: SIZES.md,
  },
  continueButton: {
    paddingVertical: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: SIZES.subtitle,
    color: 'rgba(255,255,255,0.55)',
  },
});

export default CarritoAlquilerScreen;
