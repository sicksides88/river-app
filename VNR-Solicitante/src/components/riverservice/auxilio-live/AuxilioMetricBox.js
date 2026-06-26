import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../../constants/theme';
import { getStatusAccent } from '../../../utils/auxilioLive';

const AuxilioMetricBox = ({ status, etaMinutes }) => {
  const accent = getStatusAccent(status);

  if (status === 'arribado') {
    return (
      <View style={[styles.box, { borderColor: accent }]}>
        <Text style={styles.label}>ESTADO</Text>
        <Text style={[styles.value, { color: accent }]}>En el lugar</Text>
      </View>
    );
  }

  if (status === 'en_proceso') {
    return (
      <View style={styles.processBanner}>
        <Text style={styles.processTitle}>AUXILIO ARRIBADO · EN PROCESO</Text>
        <Text style={styles.processHint}>
          El patrón llegó al lugar y está trabajando en tu embarcación. Esperá la finalización del
          servicio.
        </Text>
      </View>
    );
  }

  if (!etaMinutes && !['asignado', 'zarpado'].includes(status)) return null;

  const eta = etaMinutes || 15;

  return (
    <View style={[styles.box, { borderColor: accent }]}>
      <Text style={styles.label}>ETA</Text>
      <Text style={[styles.value, { color: accent }]}>{eta} MIN</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    marginBottom: SIZES.md,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  processBanner: {
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  processTitle: {
    color: COLORS.accentOrange,
    fontSize: SIZES.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
  },
  processHint: { color: COLORS.textSecondary, fontSize: SIZES.caption, lineHeight: 18 },
});

export default AuxilioMetricBox;
