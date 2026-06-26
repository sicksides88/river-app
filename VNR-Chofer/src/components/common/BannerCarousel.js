import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { bannerService } from '../../services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - SIZES.screenPadding * 2;
const BANNER_HEIGHT = 160;
const AUTO_SCROLL_INTERVAL = 5000; // 5 segundos

/**
 * Componente Carousel de Banners
 * Muestra banners con imagen y texto desde Supabase
 *
 * @param {string} location - Ubicación para filtrar banners (ej: 'home')
 * @param {function} onBannerPress - Callback cuando se presiona un banner
 */
const BannerCarousel = ({ location = 'home', onBannerPress }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoScrollRef = useRef(null);

  // Cargar banners al montar
  useEffect(() => {
    loadBanners();
  }, [location]);

  // Auto-scroll
  useEffect(() => {
    if (banners.length > 1) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [banners, activeIndex]);

  const loadBanners = async () => {
    setLoading(true);
    const result = await bannerService.getBannersByLocation(location);
    if (result.success) {
      setBanners(result.banners);
    }
    setLoading(false);
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / BANNER_WIDTH);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner) => {
    bannerService.trackBannerClick(banner.id);
    if (onBannerPress) {
      onBannerPress(banner);
    }
  };

  const renderBanner = ({ item }) => (
    <TouchableOpacity
      style={styles.bannerContainer}
      activeOpacity={0.9}
      onPress={() => handleBannerPress(item)}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.bannerImage, styles.bannerPlaceholder]}>
          <Ionicons name="image-outline" size={40} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.bannerOverlay}>
        <View style={styles.bannerTextContainer}>
          {item.title && (
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {item.title}
            </Text>
          )}
          {item.description && (
            <Text style={styles.bannerDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.button_text && (
            <View style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>{item.button_text}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {banners.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.textMuted} />
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={stopAutoScroll}
        onScrollEndDrag={startAutoScroll}
        scrollEventThrottle={16}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(_, index) => ({
          length: BANNER_WIDTH,
          offset: BANNER_WIDTH * index,
          index,
        })}
      />
      {banners.length > 1 && renderDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  loadingContainer: {
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SIZES.screenPadding,
  },
  flatListContent: {
    paddingHorizontal: SIZES.screenPadding,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    backgroundColor: COLORS.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  bannerTextContainer: {
    padding: SIZES.md,
  },
  bannerTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  bannerDescription: {
    fontSize: SIZES.body,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SIZES.sm,
  },
  bannerButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.sm,
    gap: SIZES.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 20,
  },
});

export default BannerCarousel;
