import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const RiderScreenShell = ({
  title,
  subtitle,
  headerIcon,
  onBack,
  rightAction,
  children,
  edges = ['top', 'bottom'],
  contentStyle,
}) => (
  <SafeAreaView style={styles.container} edges={edges}>
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <View style={styles.headerCenter}>
        {headerIcon ? (
          <View style={styles.headerIconWrap}>
            <Ionicons name={headerIcon} size={22} color={COLORS.riderBlue} />
          </View>
        ) : null}
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {rightAction || <View style={styles.iconBtn} />}
    </View>
    <View style={[styles.content, contentStyle]}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.riderNavy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    minHeight: SIZES.headerHeight,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.riderCard,
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: SIZES.sm },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.riderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 2, textAlign: 'center' },
  content: { flex: 1 },
});

export default RiderScreenShell;
