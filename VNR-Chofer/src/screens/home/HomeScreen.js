import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import { Card, BannerCarousel } from '../../components/common';
import userService from '../../services/user.service';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// HomeScreen basado en diseño Figma
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocketContext();
  const [activeService, setActiveService] = useState('vuelta-segura');
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingActiveTrip, setLoadingActiveTrip] = useState(false);

  // Cargar viaje activo cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      fetchActiveTrip();
    }, [])
  );

  // Escuchar eventos de socket para actualizar el banner cuando se cancela
  useEffect(() => {
    if (!isConnected || !socket) return;

    // Cuando el conductor cancela el envío
    const unsubDriverCancelled = socket.on('delivery:driver_cancelled', (data) => {
      if (activeTrip && activeTrip.id === data.deliveryId) {
        setActiveTrip(null);
      }
    });

    // Cuando cambia el estado del envío
    const unsubStatusChanged = socket.on('delivery:status_changed', (data) => {
      if (activeTrip && activeTrip.id === data.deliveryId) {
        if (data.status === 'cancelled') {
          setActiveTrip(null);
        } else if (data.status === 'delivered') {
          setActiveTrip(null);
        } else {
          // Incluye 'pending' por reasignación (el cadete canceló y se busca otro):
          // el envío sigue activo, solo cambia el estado.
          setActiveTrip(prev => prev ? { ...prev, status: data.status } : null);
        }
      }
    });

    // Cuando cambia el estado del viaje (ride)
    const unsubRideStatus = socket.on('ride:status_changed', (data) => {
      if (activeTrip && activeTrip.id === data.rideId) {
        if (data.status === 'cancelled' || data.status === 'completed') {
          setActiveTrip(null);
        } else {
          setActiveTrip(prev => prev ? { ...prev, status: data.status } : null);
        }
      }
    });

    return () => {
      unsubDriverCancelled();
      unsubStatusChanged();
      unsubRideStatus();
    };
  }, [isConnected, socket, activeTrip]);

  const fetchActiveTrip = async () => {
    try {
      setLoadingActiveTrip(true);
      const response = await userService.getActiveTrip();
      if (response.success && response.hasActiveTrip) {
        setActiveTrip(response.activeTrip);
      } else {
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('Error fetching active trip:', error);
      setActiveTrip(null);
    } finally {
      setLoadingActiveTrip(false);
    }
  };

  const handleActiveTripPress = () => {
    if (!activeTrip) return;

    if (activeTrip.type === 'delivery') {
      // Formatear datos para DeliveryTrackingScreen
      const deliveryData = {
        id: activeTrip.id,
        status: activeTrip.status,
        pickup: activeTrip.pickup,
        dropoff: activeTrip.dropoff,
        estimatedPrice: activeTrip.price,
      };

      const driverData = activeTrip.driver ? {
        id: activeTrip.driver.id,
        name: activeTrip.driver.name,
        avatar: activeTrip.driver.avatar,
        phone: activeTrip.driver.phone,
        rating: activeTrip.driver.rating || 5.0,
        vehicle: activeTrip.driver.vehicle,
        vehicleColor: activeTrip.driver.vehicleColor,
        plate: activeTrip.driver.plate,
      } : null;

      // Navegar directamente a DeliveryTracking (ahora está en HomeStackNavigator)
      navigation.navigate('DeliveryTracking', {
        delivery: deliveryData,
        driver: driverData,
        deliveryId: activeTrip.id,
      });
    } else {
      // Para rides (vuelta_segura, chofer) - pasar a TripActive con el formato esperado
      // Nota: TripActive del usuario es diferente al del conductor
      navigation.navigate('Services', {
        screen: 'TripActive',
        params: {
          rideId: activeTrip.id,
          trip: {
            id: activeTrip.id,
            pickup: activeTrip.pickup,
            dropoff: activeTrip.dropoff,
            price: activeTrip.price,
            status: activeTrip.status,
          },
          driver: activeTrip.driver,
        },
      });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Buscando conductor',
      confirmed: 'Confirmado',
      accepted: 'Conductor en camino',
      arrived: 'Conductor esperando',
      arrived_pickup: 'Llegando a recoger',
      in_progress: 'En curso',
      picked_up: 'Paquete recogido',
      in_transit: 'En tránsito',
      arrived_dropoff: 'Llegando al destino',
    };
    return statusMap[status] || status;
  };

  const getServiceIcon = (serviceType) => {
    const iconMap = {
      vuelta_segura: 'car-sport-outline',
      chofer: 'person-outline',
      envio: 'cube-outline',
      flete: 'bus-outline',
    };
    return iconMap[serviceType] || 'car-outline';
  };

  const servicesTabs = [
    { id: 'vuelta-segura', label: 'Vuelta Segura', icon: 'car-sport-outline', screen: 'VueltaSegura' },
    { id: 'envios', label: 'Envíos', icon: 'cube-outline', screen: 'Envios' },
    { id: 'fletes', label: 'Fletes', icon: 'bus-outline', screen: 'Fletes' },
    { id: 'chofer', label: 'Chofer', icon: 'person-outline', screen: 'Chofer' },
  ];

  const services = [
    {
      id: 'vuelta-segura',
      title: 'Vuelta\nSegura',
      icon: 'car-sport-outline', // Placeholder - ASSET: service-vuelta-segura.png
      screen: 'VueltaSegura',
    },
    {
      id: 'envios',
      title: 'Envíos',
      icon: 'cube-outline', // Placeholder - ASSET: service-envios.png
      screen: 'Envios',
    },
    {
      id: 'fletes',
      title: 'Fletes',
      icon: 'bus-outline', // Placeholder - ASSET: service-fletes.png
      screen: 'Fletes',
    },
    {
      id: 'chofer',
      title: 'Chofer',
      icon: 'person-outline', // Placeholder - ASSET: service-chofer.png
      screen: 'Chofer',
    },
  ];

  const handleServicePress = (service) => {
    navigation.navigate('Services', { screen: service.screen });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Services Tabs Header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {servicesTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.serviceTab, activeService === tab.id && styles.serviceTabActive]}
              onPress={() => {
                setActiveService(tab.id);
                navigation.navigate('Services', { screen: tab.screen });
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeService === tab.id ? COLORS.primary : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[
                styles.serviceTabText,
                activeService === tab.id && styles.serviceTabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Banner de viaje/envío activo */}
        {activeTrip && (
          <TouchableOpacity
            style={styles.activeTripBanner}
            onPress={handleActiveTripPress}
            activeOpacity={0.9}
          >
            <View style={styles.activeTripLeft}>
              <View style={styles.activeTripIconContainer}>
                <Ionicons
                  name={getServiceIcon(activeTrip.serviceType)}
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <View style={styles.activeTripInfo}>
                <Text style={styles.activeTripTitle}>
                  {activeTrip.type === 'delivery' ? 'Envío en curso' : 'Viaje en curso'}
                </Text>
                <Text style={styles.activeTripStatus} numberOfLines={1}>
                  {getStatusText(activeTrip.status)}
                </Text>
                {activeTrip.destination && (
                  <Text style={styles.activeTripDestination} numberOfLines={1}>
                    {activeTrip.destination}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.activeTripRight}>
              <Text style={styles.activeTripPrice}>
                ${activeTrip.price?.toLocaleString('es-AR') || '0'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Services', { screen: 'Chofer', params: { useCurrentLocation: true } })}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.searchPlaceholder}>¿A dónde vas?</Text>
          </View>
        </TouchableOpacity>

        {/* Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos que podrían interesarte</Text>

          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceIconContainer}>
                  {/* Placeholder - reemplazar con Image cuando tengas assets */}
                  <Ionicons name={service.icon} size={36} color={COLORS.text} />
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Promo Card */}
        <TouchableOpacity
          style={styles.mainPromoCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Services', { screen: 'VueltaSegura' })}
        >
          <View style={styles.mainPromoContent}>
            <Text style={styles.mainPromoTitle}>¿Querés empezar un{'\n'}viaje?</Text>
            <TouchableOpacity style={styles.mainPromoButton}>
              <Text style={styles.mainPromoButtonText}>Viajar con la app</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mainPromoImageContainer}>
            {/* Placeholder - ASSET: promo-hand-phone.png */}
            <View style={styles.mainPromoImagePlaceholder}>
              <Ionicons name="phone-portrait-outline" size={60} color={COLORS.textMuted} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Banner Carousel desde CRM */}
        <BannerCarousel
          location="home"
          onBannerPress={(banner) => {
            if (banner.action_type === 'screen' && banner.action_value) {
              navigation.navigate(banner.action_value);
            } else if (banner.action_type === 'url' && banner.action_value) {
              Linking.openURL(banner.action_value);
            }
          }}
        />
      </ScrollView>
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
    paddingBottom: SIZES.xxl,
  },

  // Services Tabs
  tabsContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  serviceTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl,
    backgroundColor: COLORS.transparent,
    marginRight: SIZES.sm,
    gap: SIZES.xs,
  },
  serviceTabActive: {
    backgroundColor: COLORS.white,
  },
  serviceTabText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  serviceTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },

  // Section
  section: {
    paddingHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.md,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (SCREEN_WIDTH - SIZES.screenPadding * 2 - SIZES.sm * 3) / 4,
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
    ...SHADOWS.xs,
  },
  serviceTitle: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.white,
    textAlign: 'center',
  },

  // Main Promo Card
  mainPromoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundTertiary,
    marginHorizontal: SIZES.screenPadding,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  mainPromoContent: {
    flex: 1,
  },
  mainPromoTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.md,
    lineHeight: 26,
  },
  mainPromoButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl,
    alignSelf: 'flex-start',
  },
  mainPromoButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  mainPromoImageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPromoImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active Trip Banner
  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.md,
  },
  activeTripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeTripIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  activeTripInfo: {
    flex: 1,
  },
  activeTripTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  activeTripStatus: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  activeTripDestination: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  activeTripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  activeTripPrice: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: SIZES.xs,
  },

});

export default HomeScreen;
