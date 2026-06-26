import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { getRiderDisplayName, getRiderInitials } from '../../utils/riderDisplay';
import { getVesselDisplayLine } from '../../hooks/useRiderServiceFlow';

const RiderNaveganteRow = ({ auxilio }) => {
  const solicitante = auxilio?.solicitante || auxilio?.user;
  const name = getRiderDisplayName(solicitante);
  const initials = getRiderInitials(solicitante);
  const vesselLine = getVesselDisplayLine(auxilio);

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.vessel}>{vesselLine}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.subtitle },
  info: { flex: 1 },
  name: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '700' },
  vessel: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
});

export default RiderNaveganteRow;
