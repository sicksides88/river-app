import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/theme';

const AuxilioSimulateButton = ({
  isSimulating,
  stepLabel,
  onStart,
  onStop,
}) => {
  if (!__DEV__) return null;

  if (isSimulating) {
    return (
      <TouchableOpacity style={styles.runningBtn} onPress={onStop} activeOpacity={0.85}>
        <Ionicons name="stop-circle" size={14} color={COLORS.accentOrange} />
        <Text style={styles.runningText} numberOfLines={1}>
          {stepLabel}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.demoBtn} onPress={onStart} activeOpacity={0.85}>
      <Ionicons name="flask-outline" size={15} color={COLORS.info} />
      <Text style={styles.demoText}>Demo</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 18, 32, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  runningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 96,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 18, 32, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.55)',
  },
  runningText: {
    color: COLORS.accentOrange,
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
});

export default AuxilioSimulateButton;
