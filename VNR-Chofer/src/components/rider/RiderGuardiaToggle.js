import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderGuardiaToggle = ({ active, onToggle, loading }) => (
  <View style={[styles.card, active && styles.cardActive]}>
    <View style={styles.left}>
      <View style={styles.statusRow}>
        <View style={[styles.dot, active && styles.dotActive]} />
        <Text style={[styles.label, active && styles.labelActive]}>
          {active ? 'EN GUARDIA · DISPONIBLE' : 'FUERA DE GUARDIA'}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        {active ? 'Tu ubicación se transmite al backoffice' : 'Activá para recibir solicitudes de auxilio'}
      </Text>
    </View>
    <Switch
      value={active}
      onValueChange={onToggle}
      disabled={loading}
      trackColor={{ false: COLORS.border, true: COLORS.riderBlue }}
      thumbColor={COLORS.white}
    />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  cardActive: {
    borderColor: COLORS.riderBlue,
    shadowColor: COLORS.riderBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  left: { flex: 1, marginRight: SIZES.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.textMuted },
  dotActive: { backgroundColor: COLORS.riderBlue },
  label: { color: COLORS.textSecondary, fontSize: SIZES.caption, fontWeight: '700', letterSpacing: 0.3 },
  labelActive: { color: COLORS.riderBlue },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.caption, lineHeight: 18 },
});

export default RiderGuardiaToggle;
