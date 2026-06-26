import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// MarketplaceAlquilerScreen - Marketplace de alquiler basado en Figma
const MarketplaceAlquilerScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('alquilar'); // 'comprar' | 'alquilar'
  const [searchQuery, setSearchQuery] = useState('');

  // Productos de alquiler
  const products = [
    {
      id: '1',
      name: 'Monopatín Eléctrico Extreme 300',
      rating: 4.0,
      pricePerHour: 15314,
      image: null,
    },
    {
      id: '2',
      name: 'Bicicleta Electrica Bi-200',
      rating: 4.0,
      pricePerHour: 21000,
      image: null,
    },
    {
      id: '3',
      name: 'Bicicleta Spinning Athletic Bi-660',
      rating: 4.0,
      pricePerHour: 19000,
      image: null,
    },
    {
      id: '4',
      name: 'Monopatín Electrico Xiaomi M365',
      rating: 4.0,
      pricePerHour: 12000,
      image: null,
    },
  ];

  const formatPrice = (price) => {
    return '$' + price.toLocaleString('es-AR');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={i <= rating ? '#F5A623' : COLORS.textMuted}
        />
      );
    }
    return stars;
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductoDetalle', { product, type: 'alquiler' });
  };

  const handleCartPress = () => {
    navigation.navigate('CarritoAlquiler');
  };

  const handleFilterPress = () => {
    // TODO: Show filter modal
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="flash-outline" size={40} color={COLORS.textMuted} />
          </View>
        )}
      </View>

      {/* Product Info */}
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.productPrice}>{formatPrice(item.pricePerHour)}</Text>
        <Text style={styles.priceUnit}>/Hora</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'comprar' && styles.tabActive]}
          onPress={() => {
            setActiveTab('comprar');
            navigation.navigate('Marketplace');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="cart-outline"
            size={18}
            color={activeTab === 'comprar' ? COLORS.text : 'rgba(255,255,255,0.55)'}
          />
          <Text style={[styles.tabText, activeTab === 'comprar' && styles.tabTextActive]}>
            Comprar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'alquilar' && styles.tabActive]}
          onPress={() => setActiveTab('alquilar')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeTab === 'alquilar' ? COLORS.text : 'rgba(255,255,255,0.55)'}
          />
          <Text style={[styles.tabText, activeTab === 'alquilar' && styles.tabTextActive]}>
            Alquilar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Productos"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleCartPress}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Availability Info */}
      <View style={styles.availabilityContainer}>
        <Text style={styles.availabilityText}>
          Vehiculos Disponibles Para El 23/10 De 16:00 A 18:00
        </Text>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusXl,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: SIZES.xs,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.text,
  },
  tabText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.text,
  },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  searchButton: {
    padding: SIZES.xs,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Availability
  availabilityContainer: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
  },
  availabilityText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Products Grid
  productsContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.sm,
    ...SHADOWS.sm,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: SIZES.sm,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    minHeight: 32,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
    gap: SIZES.xs,
  },
  ratingText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceUnit: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
});

export default MarketplaceAlquilerScreen;
