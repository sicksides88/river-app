import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const ICON_SIZE = 22;

const ServiceIcon = ({ option }) => {
  const color = option.danger ? COLORS.error : COLORS.text;
  const IconComponent = option.iconFamily === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={[styles.iconBox, option.danger && styles.iconBoxDanger]}>
      <IconComponent name={option.icon} size={ICON_SIZE} color={color} />
    </View>
  );
};

const ServiceStatusCard = ({ option, selected, onPress, fullWidth }) => (
  <TouchableOpacity
    style={[
      styles.card,
      fullWidth && styles.cardFull,
      option.danger && styles.cardDanger,
      selected && styles.cardSelected,
      selected && option.danger && styles.cardDangerSelected,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <ServiceIcon option={option} />
    <Text style={[styles.cardTitle, option.danger && styles.cardTitleDanger]} numberOfLines={2}>
      {option.label}
    </Text>
    <Text
      style={[styles.cardSubtitle, option.danger && styles.cardSubtitleDanger]}
      numberOfLines={2}
    >
      {option.subtitle}
    </Text>
  </TouchableOpacity>
);

const FailureOption = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.failureBtn, selected && styles.failureBtnSelected]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.failureText, selected && styles.failureTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

/**
 * Paso 1 — Servicio: grilla 2×2 de estados + salud ancho completo + fallas opcionales.
 */
const SOSStepServicio = ({
  emergencyType,
  onSelectEmergency,
  failureTypes,
  onToggleFailure,
  gridOptions,
  healthOption,
  failureOptions,
}) => (
  <View style={styles.wrap}>
    <View style={styles.grid}>
      {gridOptions.map((option) => (
        <View key={option.id} style={styles.gridCell}>
          <ServiceStatusCard
            option={option}
            selected={emergencyType === option.id}
            onPress={() => onSelectEmergency(option.id)}
          />
        </View>
      ))}
    </View>

    {healthOption ? (
      <ServiceStatusCard
        option={healthOption}
        selected={emergencyType === healthOption.id}
        onPress={() => onSelectEmergency(healthOption.id)}
        fullWidth
      />
    ) : null}

    <Text style={styles.failureHeading}>TIPO DE FALLA · OPCIONAL</Text>
    <View style={styles.failureGrid}>
      {failureOptions.map((label) => (
        <View key={label} style={styles.failureCell}>
          <FailureOption
            label={label}
            selected={failureTypes.includes(label)}
            onPress={() => onToggleFailure(label)}
          />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SIZES.xs,
    marginBottom: SIZES.sm,
  },
  gridCell: {
    width: '50%',
    padding: SIZES.xs,
  },
  card: {
    flex: 1,
    minHeight: 132,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFull: {
    width: '100%',
    minHeight: 112,
    marginBottom: SIZES.lg,
  },
  cardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.55)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  cardSelected: {
    borderColor: COLORS.info,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  cardDangerSelected: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  iconBoxDanger: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardTitleDanger: { color: COLORS.error },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  cardSubtitleDanger: { color: COLORS.errorText },
  failureHeading: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: SIZES.sm,
  },
  failureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SIZES.xs,
  },
  failureCell: {
    width: '50%',
    padding: SIZES.xs,
  },
  failureBtn: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  failureBtnSelected: {
    borderColor: COLORS.info,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  failureText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  failureTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default SOSStepServicio;
