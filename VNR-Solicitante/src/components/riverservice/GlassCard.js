import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default GlassCard;
