import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const LinkTypeOptionCard = ({
  option,
  isCurrent,
  isSelected,
  onPress,
  onPressIn,
  onPressOut,
}) => {
  const active = isCurrent || isSelected;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, active && styles.iconBoxActive]}>
            <Ionicons
              name={option.icon}
              size={24}
              color={active ? COLORS.info : COLORS.textMuted}
            />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
          </View>
          {isCurrent ? (
            <View style={styles.currentBadge}>
              <Ionicons name="checkmark" size={14} color={COLORS.info} />
              <Text style={styles.currentBadgeText}>Actual</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          )}
        </View>
        <Text style={styles.cardDetail}>{option.detail}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SIZES.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
  },
  cardActive: {
    borderColor: COLORS.info,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    lineHeight: 22,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    marginTop: 4,
    lineHeight: 18,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    marginLeft: SIZES.sm,
  },
  currentBadgeText: {
    color: COLORS.info,
    fontSize: SIZES.caption,
    fontWeight: '700',
  },
  cardDetail: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    lineHeight: 18,
    marginTop: SIZES.md,
  },
});

export default LinkTypeOptionCard;
