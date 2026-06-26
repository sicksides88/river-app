import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const DEFAULT_STEPS = ['Solicitado', 'Asignado', 'Arribo'];

const StepperVertical = ({ steps = DEFAULT_STEPS, currentIndex = 0 }) => (
  <View style={styles.container}>
    {steps.map((step, index) => {
      const done = index < currentIndex;
      const active = index === currentIndex;
      return (
        <View key={step} style={styles.row}>
          <View style={styles.left}>
            <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
              {done ? (
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
              ) : (
                <View style={[styles.innerDot, active && styles.innerDotActive]} />
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.line, done && styles.lineDone]} />
            )}
          </View>
          <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]}>
            {step}
          </Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { paddingVertical: SIZES.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  left: { width: 32, alignItems: 'center' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  dotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotActive: { borderColor: COLORS.primaryAccent },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  innerDotActive: { backgroundColor: COLORS.primaryAccent },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  lineDone: { backgroundColor: COLORS.primary },
  label: {
    flex: 1,
    paddingTop: 2,
    paddingLeft: SIZES.sm,
    color: COLORS.textMuted,
    fontSize: SIZES.body,
  },
  labelActive: { color: COLORS.text, fontWeight: '600' },
  labelDone: { color: COLORS.primaryLight },
});

export default StepperVertical;
