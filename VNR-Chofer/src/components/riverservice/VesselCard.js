import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import GlassCard from './GlassCard';

const VesselCard = ({ vessel, selected, onPress, compact }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <GlassCard style={[styles.card, selected && styles.selected, compact && styles.compact]}>
      <View style={styles.iconWrap}>
        <Ionicons name="boat-outline" size={compact ? 20 : 28} color={COLORS.primaryAccent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{vessel.name || 'Sin nombre'}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[vessel.registration, vessel.type, vessel.length_m && `${vessel.length_m}m`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={COLORS.primaryAccent} />}
    </GlassCard>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  compact: { paddingVertical: SIZES.sm },
  selected: { borderColor: COLORS.primaryAccent, borderWidth: 1.5 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  info: { flex: 1 },
  name: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '600' },
  meta: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 2 },
});

export default VesselCard;
