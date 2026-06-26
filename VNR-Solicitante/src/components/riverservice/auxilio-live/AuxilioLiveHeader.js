import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/theme';
import { getAuxilioDisplayId, getStatusBadgeLabel, getStatusAccent } from '../../../utils/auxilioLive';

const AuxilioLiveHeader = ({ auxilio, onBack, rightSlot }) => {
  const insets = useSafeAreaInsets();
  const accent = getStatusAccent(auxilio?.status);
  const badge = `${getAuxilioDisplayId(auxilio)} · ${getStatusBadgeLabel(auxilio?.status)}`;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SIZES.sm }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
      </TouchableOpacity>
      <View style={[styles.badge, { borderColor: accent }]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.badgeText, { color: accent }]} numberOfLines={1}>
          {badge}
        </Text>
      </View>
      <View style={styles.rightSlot}>{rightSlot || <View style={styles.spacer} />}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.sm,
    paddingVertical: 8,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.85)',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  rightSlot: { minWidth: 40, alignItems: 'flex-end' },
  spacer: { width: 40 },
});

export default AuxilioLiveHeader;
