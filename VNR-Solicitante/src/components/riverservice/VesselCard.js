import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import {
  formatVesselLocationLine,
  formatVesselSpecsLine,
  getVesselTypeIcon,
} from '../../utils/vesselForm';

const VesselCard = ({ vessel, selected, onPress, compact }) => {
  const location = formatVesselLocationLine(vessel);
  const iconName = getVesselTypeIcon(vessel?.type);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <View
        style={[
          styles.card,
          selected && styles.cardActive,
          compact && styles.compact,
        ]}
      >
        <View style={[styles.iconBox, selected && styles.iconBoxActive]}>
          <Ionicons
            name={iconName}
            size={compact ? 20 : 24}
            color={selected ? COLORS.info : COLORS.textSecondary}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {vessel.name || 'Sin nombre'}
            </Text>
            {selected ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVA</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.specs} numberOfLines={1}>
            {formatVesselSpecsLine(vessel)}
          </Text>
          {location ? (
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>

        {onPress ? (
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  cardActive: {
    borderColor: COLORS.info,
    borderWidth: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  compact: { paddingVertical: SIZES.sm },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  iconBoxActive: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  info: { flex: 1, minWidth: 0, paddingRight: SIZES.sm },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SIZES.xs,
    marginBottom: 4,
  },
  name: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    flexShrink: 1,
  },
  activeBadge: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  activeBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  specs: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    lineHeight: 18,
  },
  location: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    marginTop: 2,
    lineHeight: 18,
  },
});

export default VesselCard;
