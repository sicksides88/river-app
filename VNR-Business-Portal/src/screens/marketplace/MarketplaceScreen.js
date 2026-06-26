import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { productService } from '../../services';

// MarketplaceScreen basado en diseño Figma
// Tabs: Comprar | Alquilar
// Grid de productos con imagen, nombre, categoría, precio
const MarketplaceScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('comprar');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await productService.getCategories();
        setCategories(result.categories || []);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    loadCategories();
  }, []);

  const fetchProducts = useCallback(async (pageNum = 1, search = '', categoryId = selectedCategory) => {
    try {
      if (pageNum === 1) setLoading(true);

      const params = {
        page: pageNum,
        limit: 20,
        product_type: activeTab === 'alquilar' ? 'rental' : 'sale',
      };

      let result;
      if (search.trim()) {
        result = await productService.searchProducts(search, params);
      } else if (categoryId) {
        result = await productService.getProductsByCategory(categoryId, params);
      } else {
        result = await productService.getProducts(params);
      }

      const fetched = result.products || [];

      if (pageNum === 1) {
        setProducts(fetched);
      } else {
        setProducts(prev => [...prev, ...fetched]);
      }

      setHasMore(pageNum < result.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedCategory]);

  useEffect(() => {
    fetchProducts(1, searchQuery, selectedCategory);
  }, [activeTab, selectedCategory]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(1, searchQuery, selectedCategory);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, searchQuery, selectedCategory);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1, searchQuery, selectedCategory);
    }
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const formatPrice = (price) => {
    return '$' + (price || 0).toLocaleString('es-AR');
  };

  const renderProduct = ({ item }) => {
    const price = item.promotional_price || item.base_price || 0;
    const rentalPrice = item.rental_price || 0;
    const lowStock = item.stock !== null && item.stock > 0 && item.stock <= 5;
    const categoryName = item.categories?.name;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.7}
      >
        <View style={styles.productImageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="bicycle-outline" size={60} color={COLORS.textMuted} />
            </View>
          )}
          {lowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>POCOS</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          {categoryName && (
            <Text style={styles.productCategory} numberOfLines={1}>
              {categoryName}
            </Text>
          )}
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>
            {activeTab === 'comprar'
              ? formatPrice(price)
              : `${formatPrice(rentalPrice)} /Hora`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'comprar' && styles.tabActive]}
          onPress={() => setActiveTab('comprar')}
        >
          <Ionicons
            name="cart-outline"
            size={18}
            color={activeTab === 'comprar' ? COLORS.text : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'comprar' && styles.tabTextActive]}>
            Comprar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alquilar' && styles.tabActive]}
          onPress={() => setActiveTab('alquilar')}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeTab === 'alquilar' ? COLORS.text : COLORS.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'alquilar' && styles.tabTextActive]}>
            Alquilar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Productos"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchIcon}>
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Availability info for rental */}
      {activeTab === 'alquilar' && (
        <View style={styles.availabilityInfo}>
          <Text style={styles.availabilityText}>
            Vehículos Disponibles Para El 23/10 De 16:00 A 18:00
          </Text>
        </View>
      )}

      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.text} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No se encontraron productos</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
    gap: SIZES.xs,
  },
  tabActive: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  tabText: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.sm + 2,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  searchIcon: {
    padding: SIZES.xs,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
  },
  categoriesScroll: {
    flexGrow: 0,
    marginBottom: SIZES.md,
  },
  categoriesContainer: {
    paddingHorizontal: SIZES.screenPadding,
    gap: SIZES.sm,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs + 2,
    borderRadius: SIZES.radiusXl,
    backgroundColor: COLORS.backgroundInput,
  },
  categoryChipActive: {
    backgroundColor: COLORS.text,
  },
  categoryChipText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  availabilityInfo: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
  },
  availabilityText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  productsList: {
    paddingHorizontal: SIZES.screenPadding - SIZES.xs,
    paddingBottom: SIZES.xxl,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 140,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: SIZES.sm,
    left: SIZES.sm,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusXs,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  productInfo: {
    padding: SIZES.sm,
  },
  productName: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SIZES.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SIZES.xxl * 2,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
  },
});

export default MarketplaceScreen;
