import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderDataTable = ({ title, rows }) => (
  <View style={styles.wrap}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {rows.map(([label, value], i) => (
      <View key={label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={2}>{value || '—'}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.riderLabel,
    fontSize: SIZES.caption,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm + 2,
    gap: SIZES.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { color: COLORS.textMuted, fontSize: SIZES.body, flex: 1 },
  value: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '600', flex: 1, textAlign: 'right' },
});

export default RiderDataTable;
