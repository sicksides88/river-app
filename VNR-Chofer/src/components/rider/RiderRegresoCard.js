import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import RiderPrimaryButton from './RiderPrimaryButton';

const RiderRegresoCard = ({
  baseName,
  distanceKm,
  etaMinutes,
  onComplete,
  loading,
}) => (
  <View style={styles.card}>
    <View style={styles.checkCircle}>
      <Ionicons name="checkmark" size={32} color={COLORS.white} />
    </View>
    <Text style={styles.title}>Servicio finalizado</Text>
    <Text style={styles.subtitle}>
      Volvé a la base operativa para cerrar administrativamente el auxilio.
    </Text>

    <View style={styles.baseBox}>
      <View style={styles.baseIcon}>
        <Ionicons name="location" size={20} color={COLORS.riderBlue} />
      </View>
      <View style={styles.baseInfo}>
        <Text style={styles.baseLabel}>BASE DE DESTINO</Text>
        <Text style={styles.baseValue}>
          {baseName || 'Base operativa'}
          {distanceKm != null ? ` · ${distanceKm} km` : ''}
          {etaMinutes != null ? ` · ETA ${etaMinutes} MIN` : ''}
        </Text>
      </View>
    </View>

    <RiderPrimaryButton
      title="Marcar regreso a base completado"
      onPress={onComplete}
      loading={loading}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.riderCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    gap: SIZES.md,
    alignItems: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.sm,
  },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.sm,
  },
  baseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    backgroundColor: COLORS.riderCardElevated,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
  },
  baseIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.riderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseInfo: { flex: 1 },
  baseLabel: {
    color: COLORS.riderLabel,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  baseValue: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '700' },
});

export default RiderRegresoCard;
