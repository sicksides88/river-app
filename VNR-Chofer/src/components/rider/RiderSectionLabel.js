import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderSectionLabel = ({ children, optional }) => (
  <Text style={styles.label}>
    {children}
    {optional ? ' · OPCIONAL' : ''}
  </Text>
);

const styles = StyleSheet.create({
  label: {
    color: COLORS.riderLabel,
    fontSize: SIZES.caption,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SIZES.sm,
  },
});

export default RiderSectionLabel;
