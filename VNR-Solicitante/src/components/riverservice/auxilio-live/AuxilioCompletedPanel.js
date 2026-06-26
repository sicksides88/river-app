import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../common';
import { COLORS, SIZES } from '../../../constants/theme';
import {
  getEmergencyLabel,
  isDangerEmergency,
  formatDurationLabel,
} from '../../../utils/auxilioLive';

const AuxilioCompletedPanel = ({ auxilio, onRate, onDetail, onReport }) => {
  const emergencyLabel = getEmergencyLabel(auxilio?.emergencyType);
  const danger = isDangerEmergency(auxilio?.emergencyType);
  const duration = auxilio?.durationLabel || formatDurationLabel(auxilio?.durationMinutes);
  const patronName = auxilio?.driver?.name || '—';

  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <View style={styles.iconInner}>
          <Ionicons name="checkmark" size={36} color={COLORS.info} />
        </View>
      </View>

      <Text style={styles.title}>Servicio completado</Text>
      <Text style={styles.subtitle}>
        Recibirás el detalle del servicio por email en los próximos minutos.
      </Text>

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tipo de auxilio</Text>
          <Text style={[styles.rowValue, danger && styles.danger]}>{emergencyLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Patrón</Text>
          <Text style={styles.rowValue}>{patronName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Duración</Text>
          <Text style={styles.rowValue}>{duration}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
        <Text style={styles.infoText}>
          El servicio se cobra desde que el rider sale de la base hasta que regresa a ella.
        </Text>
      </View>

      <Button title="Calificar servicio" onPress={onRate} style={styles.rateBtn} />

      <TouchableOpacity onPress={onDetail}>
        <Text style={styles.link}>Ver detalle completo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportLink} onPress={onReport}>
        <Ionicons name="flag-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.reportLinkText}>Reportar un problema</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingBottom: SIZES.lg },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
    lineHeight: 20,
    paddingHorizontal: SIZES.md,
  },
  summary: {
    width: '100%',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  rowLabel: { color: COLORS.textMuted, fontSize: SIZES.body },
  rowValue: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '700' },
  danger: { color: COLORS.error },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.caption, lineHeight: 18 },
  rateBtn: { width: '100%', marginBottom: SIZES.md },
  link: { color: COLORS.info, fontSize: SIZES.body, fontWeight: '600', marginBottom: SIZES.lg },
  reportLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reportLinkText: { color: COLORS.textMuted, fontSize: SIZES.caption },
});

export default AuxilioCompletedPanel;
