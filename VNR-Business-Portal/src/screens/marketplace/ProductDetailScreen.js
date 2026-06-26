import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import couponService from '../../services/coupon.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ProductDetailScreen - Detalle de producto basado en diseño Figma
const ProductDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { product } = route.params || {};

  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('buy'); // 'buy' | 'rent'
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Normalize product data from API or use mock
  const productData = product
    ? {
        ...product,
        price: product.promotional_price || product.base_price || 0,
        pricePerHour: product.rental_price || 0,
        rating: product.rating || 0,
        reviews: product.reviews_count || 0,
        description: product.description || '',
        specs: product.specs || [],
        image: product.image_url ? { uri: product.image_url } : null,
        images: product.images && product.images.length > 0
          ? product.images
          : (product.image_url ? [product.image_url] : []),
        inStock: product.stock === null || product.stock > 0,
        stockCount: product.stock ?? 99,
      }
    : {
        id: '1',
        name: 'Monopatín Eléctrico Extreme 300',
        price: 2531300,
        pricePerHour: 15314,
        rating: 4.0,
        reviews: 128,
        description:
          'Monopatín eléctrico de alta gama con motor de 300W, batería de larga duración y diseño moderno. Ideal para desplazamientos urbanos.',
        specs: [
          { label: 'Motor', value: '300W' },
          { label: 'Velocidad máx.', value: '25 km/h' },
          { label: 'Autonomía', value: '25 km' },
          { label: 'Peso', value: '12 kg' },
          { label: 'Carga máx.', value: '100 kg' },
        ],
        inStock: true,
        stockCount: 3,
      };

  const formatPrice = (price) => {
    return '$' + price.toLocaleString('es-AR');
  };

  const incrementQuantity = () => {
    if (quantity < productData.stockCount) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const currentPrice = selectedTab === 'buy' ? productData.price : productData.pricePerHour;
  const cartTotal = currentPrice * quantity;
  const discount = couponResult?.data?.discount || 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    setCouponResult(null);
    try {
      const result = await couponService.applyCoupon(couponCode.trim(), cartTotal, 0);
      setCouponResult(result);
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Cupón inválido');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
    setCouponError('');
  };

  const handleAddToCart = () => {
    // Add to cart logic
    navigation.goBack();
  };

  const handleBuyNow = () => {
    // Navigate to checkout
    navigation.navigate('Checkout', {
      product: productData,
      quantity,
      mode: selectedTab,
      coupon: couponResult ? { code: couponCode.trim(), discount, result: couponResult } : undefined,
    });
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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? COLORS.error : COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Images Carousel */}
        <View style={styles.imageCarouselWrapper}>
          {productData.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(index);
              }}
            >
              {productData.images.map((img, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri: img }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imageContainer}>
              {productData.image ? (
                <Image
                  source={productData.image}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="bicycle-outline" size={120} color={COLORS.textMuted} />
                </View>
              )}
            </View>
          )}
          {productData.images.length > 1 && (
            <View style={styles.carouselDots}>
              {productData.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.carouselDot,
                    currentImageIndex === index && styles.carouselDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Buy/Rent Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'buy' && styles.tabActive]}
            onPress={() => setSelectedTab('buy')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selectedTab === 'buy' && styles.tabTextActive]}>
              Comprar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'rent' && styles.tabActive]}
            onPress={() => setSelectedTab('rent')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selectedTab === 'rent' && styles.tabTextActive]}>
              Alquilar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productData.name}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {selectedTab === 'buy'
                ? formatPrice(productData.price)
                : `${formatPrice(productData.pricePerHour)} /hora`}
            </Text>
            {productData.inStock ? (
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>
                  {productData.stockCount <= 5
                    ? `Quedan ${productData.stockCount}`
                    : 'En stock'}
                </Text>
              </View>
            ) : (
              <View style={[styles.stockBadge, styles.outOfStockBadge]}>
                <Text style={[styles.stockText, styles.outOfStockText]}>Sin stock</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quantity Selector (for buying) */}
        {selectedTab === 'buy' && (
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Cantidad</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                onPress={decrementQuantity}
                activeOpacity={0.7}
                disabled={quantity === 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={quantity === 1 ? COLORS.textMuted : COLORS.text}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity >= productData.stockCount && styles.quantityButtonDisabled,
                ]}
                onPress={incrementQuantity}
                activeOpacity={0.7}
                disabled={quantity >= productData.stockCount}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={quantity >= productData.stockCount ? COLORS.textMuted : COLORS.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{productData.description}</Text>
        </View>

        {/* Specifications */}
        {productData.specs.length > 0 && (
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Especificaciones</Text>
            {productData.specs.map((spec, index) => (
              <View key={index} style={styles.specRow}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Coupon Section */}
        <View style={styles.couponSection}>
          <Text style={styles.sectionTitle}>Cupón de descuento</Text>
          {couponResult ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedInfo}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.couponAppliedText}>
                  "{couponCode}" — {formatPrice(discount)} de descuento
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <View style={styles.couponInputWrapper}>
                <Input
                  placeholder="Código de cupón"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                  containerStyle={styles.couponInputContainer}
                />
              </View>
              <TouchableOpacity
                style={[styles.couponButton, (!couponCode.trim() || applyingCoupon) && styles.couponButtonDisabled]}
                onPress={handleApplyCoupon}
                disabled={!couponCode.trim() || applyingCoupon}
                activeOpacity={0.7}
              >
                {applyingCoupon ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.couponButtonText}>Aplicar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.totalPriceRow}>
            {discount > 0 && (
              <Text style={styles.totalPriceOld}>
                {selectedTab === 'buy'
                  ? formatPrice(cartTotal)
                  : `${formatPrice(productData.pricePerHour)} /hora`}
              </Text>
            )}
            <Text style={styles.totalPrice}>
              {selectedTab === 'buy'
                ? formatPrice(cartTotal - discount)
                : `${formatPrice(productData.pricePerHour)} /hora`}
            </Text>
          </View>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={handleAddToCart}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Button
            title={selectedTab === 'buy' ? 'Comprar ahora' : 'Alquilar ahora'}
            onPress={handleBuyNow}
            style={styles.buyButton}
            disabled={!productData.inStock}
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
  headerActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Image Carousel
  imageCarouselWrapper: {
    marginBottom: SIZES.sm,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.sm,
    gap: SIZES.xs,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  carouselDotActive: {
    backgroundColor: COLORS.text,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderRadius: SIZES.radiusXl,
    backgroundColor: COLORS.backgroundInput,
  },
  tabActive: {
    backgroundColor: COLORS.black,
  },
  tabText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Product Info
  productInfo: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  productName: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },
  stockBadge: {
    backgroundColor: COLORS.successLight || '#E8F5E9',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusXs,
  },
  outOfStockBadge: {
    backgroundColor: COLORS.errorLight || '#FFEBEE',
  },
  stockText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.success,
  },
  outOfStockText: {
    color: COLORS.error,
  },

  // Quantity
  quantitySection: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },

  // Description
  descriptionSection: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  descriptionText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Specifications
  specsSection: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  specLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  specValue: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Coupon
  couponSection: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  couponRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
    alignItems: 'flex-start',
  },
  couponInputWrapper: {
    flex: 1,
  },
  couponInputContainer: {
    marginBottom: 0,
  },
  couponButton: {
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.black,
    borderRadius: SIZES.radiusXl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponButtonDisabled: {
    opacity: 0.5,
  },
  couponButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.md,
  },
  couponAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    flex: 1,
  },
  couponAppliedText: {
    fontSize: SIZES.body,
    color: COLORS.success,
    fontWeight: '500',
    flex: 1,
  },
  couponErrorText: {
    fontSize: SIZES.caption,
    color: COLORS.error,
    marginTop: SIZES.sm,
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  totalLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  totalPriceOld: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  totalPrice: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  cartButton: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    flex: 1,
  },
});

export default ProductDetailScreen;
