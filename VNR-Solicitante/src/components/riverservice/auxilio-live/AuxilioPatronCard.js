import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../../constants/theme';
import { getPatronInitials, getPatronVesselLine, getStatusAccent } from '../../../utils/auxilioLive';

const AuxilioPatronCard = ({ driver, status }) => {
  if (!driver?.name) return null;
  const accent = getStatusAccent(status);
  const isOrange = accent === COLORS.accentOrange;

  return (
    <View style={[styles.card, isOrange && styles.cardOrange]}>
      <View style={[styles.avatar, isOrange && { borderColor: accent }]}>
        <Text style={[styles.avatarText, isOrange && { color: accent }]}>
          {getPatronInitials(driver)}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{driver.name}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {getPatronVesselLine(driver)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  cardOrange: {},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 2,
    borderColor: COLORS.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  avatarText: { color: COLORS.info, fontSize: 16, fontWeight: '700' },
  body: { flex: 1 },
  name: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '700' },
  meta: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 4 },
});

export default AuxilioPatronCard;
