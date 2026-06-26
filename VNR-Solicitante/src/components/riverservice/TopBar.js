import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const TopBar = ({ title, subtitle, onBack, rightAction }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + SIZES.sm }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.center}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{rightAction || <View style={styles.backPlaceholder} />}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backPlaceholder: { width: 40 },
  center: { flex: 1, alignItems: 'center' },
  title: { color: COLORS.text, fontSize: SIZES.title, fontWeight: '600' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 2 },
  right: { width: 40, alignItems: 'flex-end' },
});

export default TopBar;
