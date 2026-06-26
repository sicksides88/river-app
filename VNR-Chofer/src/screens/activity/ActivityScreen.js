import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '../../components/common';
import { userService } from '../../services';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ActivityScreen - "Historial" basado en diseño Figma
// Muestra historial de viajes y envíos con información real

// Iconos y colores por tipo de servicio
const SERVICE_CONFIG = {
  vuelta_segura: { icon: 'car-sport', color: COLORS.text, label: 'Vuelta Segura' },
  envio: { icon: 'cube', color: '#FF9500', label: 'Envío' },
  flete: { icon: 'car', color: '#5856D6', label: 'Flete' },
  chofer: { icon: 'person', color: '#34C759', label: 'Chofer' },
};

// Configuración de estados
const STATUS_CONFIG = {
  // Estados de viajes
  pending: { label: 'Pendiente', color: '#FF9500', icon: 'time-outline' },
  searching: { label: 'Buscando', color: '#007AFF', icon: 'search-outline' },
  accepted: { label: 'Aceptado', color: '#34C759', icon: 'checkmark-circle-outline' },
  arriving: { label: 'En camino', color: '#5856D6', icon: 'navigate-outline' },
  arrived: { label: 'Llegó', color: '#5856D6', icon: 'location-outline' },
  in_progress: { label: 'En progreso', color: '#007AFF', icon: 'car-outline' },
  completed: { label: 'Completado', color: '#34C759', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelado', color: '#FF3B30', icon: 'close-circle' },
  // Estados de envíos
  confirmed: { label: 'Confirmado', color: '#34C759', icon: 'checkmark-outline' },
  arrived_pickup: { label: 'En retiro', color: '#5856D6', icon: 'location-outline' },
  picked_up: { label: 'Retirado', color: '#007AFF', icon: 'cube-outline' },
  in_transit: { label: 'En tránsito', color: '#007AFF', icon: 'bicycle-outline' },
  arrived_dropoff: { label: 'En destino', color: '#5856D6', icon: 'flag-outline' },
  delivered: { label: 'Entregado', color: '#34C759', icon: 'checkmark-circle' },
};

const ActivityScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null); // null = todos

  const loadActivities = useCallback(async (filter = selectedFilter) => {
    try {
      const response = await userService.getHistory({
        page: 1,
        limit: 50,
        serviceType: filter,
      });

      if (response.success) {
        setActivities(response.history || []);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadActivities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const formatPrice = (price) => {
    if (!price) return '$0';
    return '$' + Math.round(price).toLocaleString('es-AR');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} - ${hours}:${minutes}`;
  };

  const handleFilterPress = () => {
    // Ciclar entre filtros: null -> vuelta_segura -> envio -> flete -> chofer -> null
    const filters = [null, 'vuelta_segura', 'envio', 'flete', 'chofer'];
    const currentIndex = filters.indexOf(selectedFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    const newFilter = filters[nextIndex];
    setSelectedFilter(newFilter);
    setLoading(true);
    loadActivities(newFilter);
  };

  const getServiceConfig = (serviceType) => {
    return SERVICE_CONFIG[serviceType] || SERVICE_CONFIG.vuelta_segura;
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || { label: status, color: COLORS.textMuted, icon: 'help-outline' };
  };

  const renderActivity = ({ item }) => {
    const serviceConfig = getServiceConfig(item.serviceType);
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
        activeOpacity={0.7}
      >
        {/* Service Thumbnail */}
        <View style={[styles.carThumbnail, { borderColor: serviceConfig.color }]}>
          <Ionicons name={serviceConfig.icon} size={24} color={serviceConfig.color} />
        </View>

        {/* Activity Info */}
        <View style={styles.activityInfo}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityDestination} numberOfLines={1}>
              {item.destination || 'Sin destino'}
            </Text>
            <Text style={styles.activityPrice}>{formatPrice(item.price)}</Text>
          </View>
          <View style={styles.activityMeta}>
            <View style={[styles.serviceBadgeSmall, { backgroundColor: serviceConfig.color }]}>
              <Text style={styles.serviceBadgeSmallText}>{serviceConfig.label}</Text>
            </View>
            {/* Status Badge */}
            <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon} size={10} color={statusConfig.color} />
              <Text style={[styles.statusBadgeSmallText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <View style={styles.activityFooter}>
            {item.driver && (
              <Text style={styles.activityDriver} numberOfLines={1}>
                {item.driver.name}
              </Text>
            )}
            <Text style={styles.activityDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading fullScreen text="Cargando historial..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      {/* Subtitle with Filter */}
      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>
          {selectedFilter ? SERVICE_CONFIG[selectedFilter]?.label || 'Todos' : 'Todos los servicios'}
        </Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter && styles.filterButtonActive,
          ]}
          onPress={handleFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="filter"
            size={18}
            color={selectedFilter ? COLORS.primary : COLORS.text}
          />
          {selectedFilter && (
            <Text style={styles.filterButtonText}>Cambiar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.text}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sin actividad</Text>
            <Text style={styles.emptySubtitle}>
              Tus viajes aparecerán aquí
            </Text>
          </View>
        }
      />
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
    paddingTop: SIZES.lg,
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Subtitle Row
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.backgroundInput,
    gap: SIZES.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.white,
  },
  filterButtonText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // List
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },

  // Activity Item
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  carThumbnail: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityDestination: {
    flex: 1,
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: SIZES.sm,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: SIZES.sm,
  },
  serviceBadgeSmall: {
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radiusXs,
  },
  serviceBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radiusXs,
    gap: 2,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityDriver: {
    flex: 1,
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.8)',
  },
  activityDate: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.6)',
  },
  activityPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl * 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  emptySubtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
});

export default ActivityScreen;
