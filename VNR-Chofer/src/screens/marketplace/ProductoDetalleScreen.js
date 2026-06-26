import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ProductoDetalleScreen - Pantalla de detalle de producto basado en Figma
const ProductoDetalleScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { product } = route.params || {};
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalize product data from API or use mock
  const productData = product
    ? {
        ...product,
        price: product.promotional_price || product.base_price || 0,
        rating: product.rating || 0,
        color: product.color || '',
        description: product.description || '',
        images: product.images || (product.image_url ? [product.image_url] : []),
        variants: product.variants || [],
      }
    : {
        name: 'Monopatín Eléctrico Extreme 300',
        price: 2531300,
        rating: 4.0,
        color: 'Amarillo',
        description: `Potencia destacada, diseño robusto y estilo único.
Equipado con un motor de 500W, alcanza una velocidad máxima de 40 km/h, permitiendo recorrer trayectos de manera ágil por la ciudad.
Su batería de litio de 48V y 10Ah brinda una autonomía de hasta 40 km, ideal para viajes diarios.`,
        images: [null, null, null, null],
        variants: [
          { id: '1', color: 'Amarillo', image: null },
          { id: '2', color: 'Negro', image: null },
          { id: '3', color: 'Rojo', image: null },
          { id: '4', color: 'Azul', image: null },
        ],
      };

  const formatPrice = (price) => {
    return '$' + price.toLocaleString('es-AR');
  };

  const handleAddToCart = () => {
    // TODO: Add to cart logic
    navigation.navigate('Carrito');
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
        {/* Product Image Carousel */}
        <View style={styles.imageCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const imageWidth = width - SIZES.screenPadding * 2;
              const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
              setCurrentImageIndex(index);
            }}
          >
            {productData.images.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                {img ? (
                  <Image
                    source={{ uri: img }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="flash-outline" size={80} color={COLORS.textMuted} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Carousel Dots */}
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

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{productData.name}</Text>

          {/* Variants */}
          {productData.variants.length > 0 && (
          <View style={styles.variantsSection}>
            <Text style={styles.variantsTitle}>Variantes</Text>
            <View style={styles.variantsContainer}>
              {productData.variants.map((variant, index) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[
                    styles.variantItem,
                    selectedVariant === index && styles.variantItemSelected,
                  ]}
                  onPress={() => setSelectedVariant(index)}
                  activeOpacity={0.7}
                >
                  {variant.image ? (
                    <Image source={{ uri: variant.image }} style={styles.variantImage} />
                  ) : (
                    <View style={styles.variantImagePlaceholder}>
                      <Ionicons name="flash-outline" size={24} color={COLORS.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.colorText}>
              Color: {productData.variants[selectedVariant]?.color || productData.color}
            </Text>
          </View>
          )}

          {/* Description */}
          <TouchableOpacity
            style={styles.descriptionHeader}
            onPress={() => setDescriptionExpanded(!descriptionExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.descriptionTitle}>Descripción</Text>
            <Ionicons
              name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {descriptionExpanded && (
            <Text style={styles.descriptionText}>{productData.description}</Text>
          )}

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{formatPrice(productData.price)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <Button
          title="Añadir al carrito"
          onPress={handleAddToCart}
          fullWidth
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
    paddingBottom: 120,
  },

  // Image Carousel
  imageCarousel: {
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  imageContainer: {
    width: width - SIZES.screenPadding * 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  productImage: {
    width: width - SIZES.screenPadding * 4,
    height: 200,
  },
  productImagePlaceholder: {
    width: width - SIZES.screenPadding * 4,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.md,
    gap: SIZES.xs,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  carouselDotActive: {
    backgroundColor: COLORS.white,
  },

  // Product Info
  productInfoContainer: {
    paddingHorizontal: SIZES.screenPadding,
  },
  productName: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },

  // Variants
  variantsSection: {
    marginBottom: SIZES.lg,
  },
  variantsTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  variantsContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  variantItem: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  variantImage: {
    width: '100%',
    height: '100%',
  },
  variantImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundInput,
  },
  colorText: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
  },

  // Description
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  descriptionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  descriptionText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },

  // Total
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  totalLabel: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  totalPrice: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Bottom Container
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    paddingBottom: SIZES.xl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
});

export default ProductoDetalleScreen;
