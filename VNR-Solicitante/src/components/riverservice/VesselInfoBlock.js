import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { formatVesselSubtitle, getVesselDetailRows } from '../../utils/vesselForm';

const VesselInfoBlock = ({ vessel, compact = false, style }) => {
  if (!vessel?.name && !vessel?.registration) return null;

  const subtitle = formatVesselSubtitle(vessel);
  const details = compact ? [] : getVesselDetailRows(vessel);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconBox}>
        <Ionicons name="boat" size={compact ? 20 : 24} color={COLORS.text} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {vessel.name || 'Embarcación'}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={compact ? 1 : 2}>
            {subtitle}
          </Text>
        ) : null}
        {details.map(([label, value]) => (
          <Text key={label} style={styles.detail} numberOfLines={1}>
            {label}: {value}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  info: { flex: 1 },
  name: {
    color: COLORS.text,
    fontSize: SIZES.title,
    fontWeight: '700',
    marginBottom: 4,
  },
  nameCompact: {
    fontSize: SIZES.subtitle,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    lineHeight: 18,
    marginBottom: 4,
  },
  detail: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    lineHeight: 18,
  },
});

export default VesselInfoBlock;
