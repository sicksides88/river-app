import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  RiderPrimaryButton,
  RiderEmergencyBanner,
  RiderCronometer,
  RiderNaveganteRow,
  RiderSafetyRejectLink,
} from '../../../components/rider';
import { COLORS, SIZES } from '../../../constants/theme';

const EnProcesoCard = ({
  auxilio,
  procesoStartedAt,
  loading,
  onPrimary,
  onSafetyReject,
}) => (
  <View style={styles.card}>
    <Text style={styles.phase}>AUXILIO ARRIBADO · EN PROCESO</Text>

    <RiderCronometer startedAt={procesoStartedAt} />

    <RiderNaveganteRow auxilio={auxilio} />

    <RiderEmergencyBanner emergencyType={auxilio?.emergencyType} />

    <RiderPrimaryButton title="Finalizar auxilio" onPress={onPrimary} loading={loading} />

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
  phase: { color: COLORS.riderOrange, fontSize: SIZES.caption, fontWeight: '700', letterSpacing: 1 },
});

export default EnProcesoCard;
