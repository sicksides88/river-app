import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RiderScreenShell, RiderDataTable, RiderPrimaryButton } from '../../components/rider';
import driverService from '../../services/driver.service';
import { COLORS, SIZES } from '../../constants/theme';
import {
  pickActiveAuxilioBoat,
  getBoatDisplayName,
  vehicleToTechnicalRows,
} from '../../utils/riderBoat';

const MiUnidadAuxilioScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await driverService.getVehicles().catch(() => ({ vehicles: [] }));
      setVehicle(pickActiveAuxilioBoat(res?.vehicles || []));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const goEdit = () => {
    if (vehicle?.id) {
      navigation.navigate('EditarUnidadAuxilio', { vehicleId: vehicle.id });
    } else {
      navigation.navigate('EditarUnidadAuxilio');
    }
  };

  if (loading) {
    return (
      <RiderScreenShell title="Mi unidad de auxilio" headerIcon="boat" onBack={() => navigation.goBack()}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.riderBlue} />
        </View>
      </RiderScreenShell>
    );
  }

  if (!vehicle) {
    return (
      <RiderScreenShell title="Mi unidad de auxilio" headerIcon="boat" onBack={() => navigation.goBack()}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="boat-outline" size={48} color={COLORS.riderBlue} />
          </View>
          <Text style={styles.emptyTitle}>Sin embarcación registrada</Text>
          <Text style={styles.emptyMessage}>
            Todavía no cargaste tu unidad de auxilio. Completá los datos técnicos para que River Service pueda
            asignarte servicios.
          </Text>
          <RiderPrimaryButton title="Agregar unidad de auxilio" onPress={goEdit} style={styles.emptyBtn} />
        </View>
      </RiderScreenShell>
    );
  }

  const displayName = getBoatDisplayName(vehicle);
  const rows = vehicleToTechnicalRows(vehicle);

  return (
    <RiderScreenShell title="Mi unidad de auxilio" headerIcon="boat" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.iconBox}>
            <Ionicons name="boat" size={28} color={COLORS.riderBlue} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.badge}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>UNIDAD DE AUXILIO</Text>
            </View>
          </View>
        </View>
        <RiderDataTable title="DATOS TÉCNICOS" rows={rows} />
        <RiderPrimaryButton
          title="Editar datos de la unidad"
          variant="outline"
          onPress={goEdit}
          style={styles.btn}
        />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.riderCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  emptyTitle: { color: COLORS.text, fontSize: SIZES.h3, fontWeight: '700', textAlign: 'center' },
  emptyMessage: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
    lineHeight: 22,
  },
  emptyBtn: { marginTop: SIZES.xl, alignSelf: 'stretch' },
  hero: {
    flexDirection: 'row',
    gap: SIZES.md,
    backgroundColor: COLORS.riderCard,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.riderCardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroText: { flex: 1, justifyContent: 'center' },
  name: { color: COLORS.text, fontSize: SIZES.h3, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.riderBlue },
  badgeText: { color: COLORS.riderBlue, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  btn: { marginTop: SIZES.lg },
});

export default MiUnidadAuxilioScreen;
