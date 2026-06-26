import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const StepperHorizontal = ({ steps, currentStep = 0 }) => (
  <View style={styles.container}>
    {steps.map((step, index) => {
      const done = index < currentStep;
      const active = index === currentStep;
      const showCheck = done || active;
      return (
        <View key={step} style={styles.stepWrap}>
          <View style={[styles.dot, showCheck && styles.dotActive]}>
            {showCheck ? (
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
            ) : (
              <Text style={styles.dotText}>{index + 1}</Text>
            )}
          </View>
          <Text style={[styles.label, showCheck && styles.labelActive]}>
            {step}
          </Text>
          {index < steps.length - 1 && (
            <View style={[styles.line, done && styles.lineDone]} />
          )}
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    marginVertical: SIZES.md,
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotDone: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  dotActive: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  dotText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  dotTextActive: { color: COLORS.white },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  labelDone: { color: COLORS.info, fontWeight: '600' },
  labelActive: { color: COLORS.text, fontWeight: '700' },
  line: {
    position: 'absolute',
    top: 14,
    left: '55%',
    right: '-45%',
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: 0,
  },
  lineDone: { backgroundColor: COLORS.info },
});

export default StepperHorizontal;
