import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/theme';
import { getTimelineSteps } from '../../../utils/auxilioLive';

const StepIcon = ({ state }) => {
  if (state === 'done') {
    return (
      <View style={[styles.dot, styles.dotDone]}>
        <Ionicons name="checkmark" size={14} color={COLORS.white} />
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View style={[styles.dot, styles.dotActive]}>
        <ActivityIndicator size="small" color={COLORS.white} />
      </View>
    );
  }
  return (
    <View style={[styles.dot, styles.dotPending]}>
      <Ionicons name="flag-outline" size={14} color={COLORS.textMuted} />
    </View>
  );
};

const AuxilioTimeline = ({ auxilio }) => {
  const steps = getTimelineSteps(auxilio);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.row}>
          <View style={styles.left}>
            <StepIcon state={step.state} />
            {index < steps.length - 1 ? (
              <View style={[styles.line, step.state === 'done' && styles.lineDone]} />
            ) : null}
          </View>
          <View style={styles.body}>
            <Text
              style={[
                styles.label,
                step.state === 'active' && styles.labelActive,
                step.state === 'pending' && styles.labelPending,
              ]}
            >
              {step.label}
            </Text>
            {step.subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  step.state === 'active' && styles.subtitleActive,
                ]}
              >
                {step.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SIZES.sm },
  row: { flexDirection: 'row', minHeight: 56 },
  left: { width: 36, alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dotDone: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  dotActive: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  dotPending: {
    backgroundColor: COLORS.backgroundTertiary,
    borderColor: COLORS.border,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineDone: { backgroundColor: COLORS.info },
  body: { flex: 1, paddingLeft: SIZES.sm, paddingBottom: SIZES.md },
  label: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '600' },
  labelActive: { color: COLORS.text },
  labelPending: { color: COLORS.textMuted },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
  subtitleActive: { color: COLORS.info, fontWeight: '600' },
});

export default AuxilioTimeline;
