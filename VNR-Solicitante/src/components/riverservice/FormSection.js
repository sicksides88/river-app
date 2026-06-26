import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const FormSection = ({ title, style }) => (
  <Text style={[styles.title, style]}>{title}</Text>
);

const styles = StyleSheet.create({
  title: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.primaryAccent,
    letterSpacing: 0.8,
    marginBottom: SIZES.sm,
    marginTop: SIZES.sm,
    textTransform: 'uppercase',
  },
});

export default FormSection;
