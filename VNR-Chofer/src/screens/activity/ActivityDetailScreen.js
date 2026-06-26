import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../components/common';
import { COLORS, SIZES } from '../../constants/theme';

const ActivityDetailScreen = ({ navigation, route }) => {
  const { activity } = route.params || {};

  const getActivityIcon = (type) => {
    switch (type) {
      case 'ride': return 'car-sport';
      case 'delivery': return 'cube';
      case 'flete': return 'car';
      default: return 'ellipse';
    }
  };

  // Color minimalista (gris claro)
  const getActivityColor = (type) => {
    return COLORS.backgroundTertiary; // #f5f5f5 - matching CSS original
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case 'ride': return 'Vuelta Segura';
      case 'delivery': return 'Envío';
      case 'flete': return 'Flete';
      default: return 'Actividad';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con botón atrás */}
      <View style={styles.headerNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: getActivityColor(activity?.type) }]}>
            <Ionicons name={getActivityIcon(activity?.type)} size={32} color={COLORS.black} />
          </View>
          <Text style={styles.title}>{getActivityLabel(activity?.type)}</Text>
          <Text style={styles.date}>{formatDate(activity?.date)}</Text>
        </View>

        {/* Route */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Recorrido</Text>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <View style={styles.originDot} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Origen</Text>
                <Text style={styles.locationText}>{activity?.origin}</Text>
              </View>
            </View>

            <View style={styles.locationLine} />

            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <View style={styles.destinationDot} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destino</Text>
                <Text style={styles.locationText}>{activity?.destination}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Payment */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Detalle del Pago</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tarifa base</Text>
            <Text style={styles.paymentValue}>${Math.round(activity?.price * 0.7)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Distancia</Text>
            <Text style={styles.paymentValue}>${Math.round(activity?.price * 0.3)}</Text>
          </View>

          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${activity?.price}</Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <Ionicons name="cash" size={20} color={COLORS.success} />
            <Text style={styles.paymentMethodText}>Pagado en efectivo</Text>
          </View>
        </Card>

        {/* Status */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statusText}>Completado</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Repetir este viaje"
            onPress={() => {}}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'capitalize',
  },
  card: {
    padding: SIZES.lg,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.md,
  },
  locationContainer: {
    paddingLeft: SIZES.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
  },
  locationLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.border,
    marginLeft: 11,
    marginVertical: SIZES.xs,
  },
  locationInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.black,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.sm,
    marginTop: SIZES.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentMethodText: {
    marginLeft: SIZES.sm,
    fontSize: 14,
    color: COLORS.gray,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: SIZES.sm,
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '500',
  },
  actions: {
    marginTop: SIZES.md,
  },
});

export default ActivityDetailScreen;
