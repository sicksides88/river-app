import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderScreenShell, RiderDataTable, RiderPrimaryButton } from '../../components/rider';
import { VesselInfoBlock } from '../../components/riverservice';
import { getVesselDetailRows, getVesselFromAuxilio } from '../../utils/vesselDisplay';
import { COLORS, SIZES } from '../../constants/theme';

const EmbarcacionAsistidaScreen = ({ navigation, route }) => {
  const { auxilio } = route.params || {};
  const vessel = getVesselFromAuxilio(auxilio);
  const solicitante = auxilio?.solicitante || auxilio?.user;
  const name = solicitante?.name || [solicitante?.nombre, solicitante?.apellido].filter(Boolean).join(' ');

  const rows = getVesselDetailRows(vessel).length
    ? getVesselDetailRows(vessel)
    : [
        ['Matrícula', vessel?.registration],
        ['Tipo', vessel?.type],
        ['Eslora', vessel?.length_m ? `${vessel.length_m} m` : null],
        ['Manga', vessel?.beam_m ? `${vessel.beam_m} m` : null],
      ];

  const call = () => {
    const phone = solicitante?.phone || solicitante?.telefono_numero;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <RiderScreenShell title="Embarcación a asistir" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <VesselInfoBlock auxilio={auxilio} />
          {name ? (
            <View style={styles.badge}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>NAVEGANTE · {name.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <RiderDataTable title="DATOS TÉCNICOS" rows={rows} />
        <RiderPrimaryButton title="Llamar al navegante" variant="outline" onPress={call} style={styles.btn} />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  card: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SIZES.md,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.riderBlue },
  badgeText: { color: COLORS.riderBlue, fontSize: SIZES.caption, fontWeight: '700' },
  btn: { marginTop: SIZES.lg },
});

export default EmbarcacionAsistidaScreen;
