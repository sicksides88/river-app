import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const renderStars = (rating) => {
  const stars = [];
  const r = typeof rating === 'number' ? rating : 5;
  const fullStars = Math.floor(r);
  const hasHalfStar = r % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Ionicons key={i} name="star" size={14} color={COLORS.star || '#F5A623'} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<Ionicons key={i} name="star-half" size={14} color={COLORS.star || '#F5A623'} />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={14} color={COLORS.star || '#F5A623'} />);
    }
  }
  return stars;
};

/**
 * ServiceTrackingCard - Card unificada para seguimiento de todos los servicios
 * (flete, envío, vuelta segura, chofer)
 *
 * @param {object} driver - { name, photo, rating, vehicle, vehicleColor, plate }
 * @param {string} originAddress - Dirección de origen/retiro
 * @param {string} destinationAddress - Dirección de destino/entrega
 * @param {string} serviceName - Nombre del servicio ("Flete", "Envío", "Vuelta Segura", etc.)
 * @param {number} servicePrice - Precio del servicio
 * @param {string} statusText - Texto de estado ("Llegando en 5 min", "En camino", etc.)
 * @param {boolean} isLive - Mostrar tag "EN VIVO"
 * @param {function} onChat - Handler del botón de chat
 * @param {function} onCancel - Handler del botón de cancelar
 * @param {boolean} showCancel - Mostrar botón de cancelar (default true)
 * @param {string} cancelLabel - Texto del botón cancelar (default "Cancelar")
 */
const ServiceTrackingCard = ({
  driver,
  originAddress,
  destinationAddress,
  serviceName,
  servicePrice,
  statusText,
  isLive,
  onChat,
  onCancel,
  showCancel = true,
  cancelLabel = 'Cancelar',
}) => {
  return (
    <View style={styles.bottomSheet}>
      {/* Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        {statusText ? (
          <View style={styles.statusHeader}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText} numberOfLines={1}>{statusText}</Text>
            {isLive && (
              <View style={styles.liveTag}>
                <Text style={styles.liveTagText}>EN VIVO</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverPhotoContainer}>
            {driver?.photo ? (
              <Image
                source={typeof driver.photo === 'string' ? { uri: driver.photo } : driver.photo}
                style={styles.driverPhoto}
              />
            ) : (
              <View style={styles.driverPhotoPlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.textMuted} />
              </View>
            )}
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {(driver?.name || 'Conductor').toUpperCase()}
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                {typeof driver?.rating === 'number' ? driver.rating.toFixed(1) : '5.0'}
              </Text>
              <View style={styles.starsContainer}>
                {renderStars(driver?.rating)}
              </View>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={onChat}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleIconContainer}>
            <Ionicons name="car-sport" size={22} color={COLORS.text} />
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleModel}>
              {driver?.vehicle || 'Vehículo'}{driver?.vehicleColor ? ` - ${driver.vehicleColor}` : ''}
            </Text>
            <Text style={styles.vehiclePlate}>{driver?.plate || '---'}</Text>
          </View>
        </View>

        {/* Route Summary */}
        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <View style={styles.originDot} />
            <Text style={styles.routeAddress} numberOfLines={1}>
              {originAddress || 'Origen'}
            </Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routePoint}>
            <View style={styles.destinationDot} />
            <Text style={styles.routeAddress} numberOfLines={1}>
              {destinationAddress || 'Destino'}
            </Text>
          </View>
        </View>

        {/* Service & Payment Info */}
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Servicio</Text>
            <Text style={styles.tripInfoValue}>{serviceName || 'Servicio'}</Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Text style={styles.tripInfoLabel}>Total</Text>
            <Text style={styles.tripInfoPrice}>
              ${servicePrice?.toLocaleString('es-AR') || '-'}
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        {showCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingBottom: SIZES.md,
    ...SHADOWS.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  content: {
    paddingHorizontal: SIZES.screenPadding,
  },

  // Status Header
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success || '#34C759',
    marginRight: SIZES.sm,
  },
  statusText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.success || '#34C759',
    flex: 1,
  },
  liveTag: {
    backgroundColor: '#22c55e',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  driverPhotoContainer: {
    marginRight: SIZES.md,
  },
  driverPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  driverPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SIZES.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: SIZES.xs,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Vehicle Card
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  vehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    ...SHADOWS.xs,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  vehiclePlate: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Route Summary
  routeSummary: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.markerOrigin || COLORS.success || '#34C759',
    marginRight: SIZES.md,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.markerDestination || COLORS.error || '#FF3B30',
    marginRight: SIZES.md,
  },
  routeAddress: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
  },

  // Trip Info
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  tripInfoItem: {
    alignItems: 'center',
  },
  tripInfoLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  tripInfoValue: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  tripInfoPrice: {
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Cancel Button
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  cancelButtonText: {
    fontSize: SIZES.body,
    color: COLORS.error,
    fontWeight: '600',
  },
});

export default ServiceTrackingCard;
