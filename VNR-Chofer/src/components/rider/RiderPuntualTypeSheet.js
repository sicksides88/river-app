import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RiderBottomSheet from './RiderBottomSheet';
import { COLORS, SIZES } from '../../constants/theme';

const OPTIONS = [
  {
    id: 'block',
    title: 'No disponible',
    subtitle: 'Bloqueá uno o más días en los que no podés estar de guardia.',
    icon: 'close-circle-outline',
    iconColor: COLORS.riderOrange,
    iconBg: COLORS.riderOrangeMuted,
  },
  {
    id: 'extra',
    title: 'Disponibilidad extra',
    subtitle: 'Sumá un día u horario adicional fuera de tu semana tipo.',
    icon: 'add-circle-outline',
    iconColor: COLORS.riderBlue,
    iconBg: 'rgba(59, 130, 246, 0.15)',
  },
];

const RiderPuntualTypeSheet = ({ visible, onClose, onSelect }) => (
  <RiderBottomSheet
    visible={visible}
    onClose={onClose}
    stepLabel="FECHA PUNTUAL"
    title="¿Qué querés configurar?"
    subtitle="Elegí si querés bloquear días o agregar disponibilidad adicional."
  >
    {OPTIONS.map((opt) => (
      <TouchableOpacity
        key={opt.id}
        style={styles.option}
        activeOpacity={0.85}
        onPress={() => onSelect(opt.id)}
      >
        <View style={[styles.iconWrap, { backgroundColor: opt.iconBg }]}>
          <Ionicons name={opt.icon} size={24} color={opt.iconColor} />
        </View>
        <View style={styles.optionBody}>
          <Text style={styles.optionTitle}>{opt.title}</Text>
          <Text style={styles.optionSub}>{opt.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    ))}
    <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
      <Text style={styles.cancelText}>Cancelar</Text>
    </TouchableOpacity>
  </RiderBottomSheet>
);

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: { flex: 1 },
  optionTitle: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.body },
  optionSub: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 4, lineHeight: 18 },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: SIZES.lg,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: SIZES.body,
  },
});

export default RiderPuntualTypeSheet;
