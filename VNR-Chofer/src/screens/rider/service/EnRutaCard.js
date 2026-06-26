import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RiderPrimaryButton,
  RiderEmergencyBanner,
  RiderServiceMetrics,
  RiderSafetyRejectLink,
} from '../../../components/rider';
import { COLORS, SIZES } from '../../../constants/theme';
import { getVesselDisplayLine } from '../../../hooks/useRiderServiceFlow';

const EnRutaCard = ({
  auxilio,
  etaMinutes,
  distanceKm,
  metricsLoading,
  loading,
  onPrimary,
  onSafetyReject,
  onViewVessel,
}) => (
  <View style={styles.card}>
    <Text style={styles.phase}>ZARPADO · EN RUTA</Text>

    <View style={styles.vesselRow}>
      <View style={styles.iconBox}>
        <Ionicons name="boat-outline" size={22} color={COLORS.text} />
      </View>
      <View style={styles.vesselInfo}>
        <Text style={styles.destLabel}>DESTINO</Text>
        <Text style={styles.vesselName}>{getVesselDisplayLine(auxilio)}</Text>
      </View>
    </View>

    <RiderEmergencyBanner emergencyType={auxilio?.emergencyType} />

    <RiderServiceMetrics
      etaMinutes={etaMinutes ?? auxilio?.etaMinutes}
      distanceKm={distanceKm}
      loading={metricsLoading}
    />

    <RiderPrimaryButton title="Informar arribo al lugar" onPress={onPrimary} loading={loading} />

    {onViewVessel ? (
      <TouchableOpacity onPress={onViewVessel} style={styles.link}>
        <Text style={styles.linkText}>Ver embarcación asistida</Text>
      </TouchableOpacity>
    ) : null}

    <RiderSafetyRejectLink onPress={onSafetyReject} />
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
  },
  phase: { color: COLORS.riderBlue, fontSize: SIZES.caption, fontWeight: '700', letterSpacing: 1 },
  vesselRow: { flexDirection: 'row', gap: SIZES.md, alignItems: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.riderCardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vesselInfo: { flex: 1 },
  destLabel: { color: COLORS.riderLabel, fontSize: SIZES.caption, fontWeight: '600' },
  vesselName: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '700' },
  link: { alignItems: 'center' },
  linkText: { color: COLORS.riderBlue, fontSize: SIZES.caption },
});

export default EnRutaCard;
