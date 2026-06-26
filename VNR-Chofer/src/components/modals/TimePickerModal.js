import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// Generar horas (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
// Generar minutos en intervalos de 5
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

const ITEM_HEIGHT = 44;

/**
 * TimePickerModal - Selector de hora inicio/fin
 */
const TimePickerModal = ({
  visible,
  onClose,
  onConfirm,
  initialStartTime = '09:00',
  initialEndTime = '18:00',
  title = 'Seleccionar horario',
  variant = 'default',
}) => {
  const isRider = variant === 'rider';
  const ui = isRider ? riderStyles : defaultStyles;
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('18');
  const [endMinute, setEndMinute] = useState('00');

  const startHourRef = useRef(null);
  const startMinuteRef = useRef(null);
  const endHourRef = useRef(null);
  const endMinuteRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Parsear tiempos iniciales
      const [sh, sm] = initialStartTime.split(':');
      const [eh, em] = initialEndTime.split(':');
      setStartHour(sh || '09');
      setStartMinute(sm || '00');
      setEndHour(eh || '18');
      setEndMinute(em || '00');
    }
  }, [visible, initialStartTime, initialEndTime]);

  const handleConfirm = () => {
    const start = `${startHour}:${startMinute}`;
    const end = `${endHour}:${endMinute}`;

    // Validar que inicio < fin
    if (start >= end) {
      // Ajustar automáticamente
      const adjustedEndHour = String(Math.min(23, parseInt(startHour) + 1)).padStart(2, '0');
      onConfirm(start, `${adjustedEndHour}:${startMinute}`);
    } else {
      onConfirm(start, end);
    }
    onClose();
  };

  const renderPicker = (items, selectedValue, onSelect, scrollRef) => (
    <ScrollView
      ref={scrollRef}
      style={styles.pickerColumn}
      contentContainerStyle={styles.pickerContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
    >
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[
            styles.pickerItem,
            item === selectedValue && ui.pickerItemSelected,
          ]}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={[
            ui.pickerItemText,
            item === selectedValue && ui.pickerItemTextSelected,
          ]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.container, ui.container]}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, ui.title]}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={isRider ? COLORS.textSecondary : COLORS.textOnLight} />
            </TouchableOpacity>
          </View>

          {/* Pickers */}
          <View style={styles.pickersContainer}>
            {/* Inicio */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, ui.pickerLabel]}>Desde</Text>
              <View style={styles.pickerRow}>
                {renderPicker(HOURS, startHour, setStartHour, startHourRef)}
                <Text style={[styles.pickerSeparator, ui.pickerSeparator]}>:</Text>
                {renderPicker(MINUTES, startMinute, setStartMinute, startMinuteRef)}
              </View>
            </View>

            {/* Separador */}
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color={isRider ? COLORS.textMuted : COLORS.textSecondary} />
            </View>

            {/* Fin */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, ui.pickerLabel]}>Hasta</Text>
              <View style={styles.pickerRow}>
                {renderPicker(HOURS, endHour, setEndHour, endHourRef)}
                <Text style={[styles.pickerSeparator, ui.pickerSeparator]}>:</Text>
                {renderPicker(MINUTES, endMinute, setEndMinute, endMinuteRef)}
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={[styles.previewContainer, ui.previewContainer]}>
            <Text style={[styles.previewText, ui.previewText]}>
              {startHour}:{startMinute} - {endHour}:{endMinute}
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, ui.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, ui.cancelButtonText]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, ui.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmButtonText, ui.confirmButtonText]}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.screenPadding,
  },
  container: {
    width: '100%',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    flex: 1,
    marginRight: SIZES.sm,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  pickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  pickerSection: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: SIZES.small,
    marginBottom: SIZES.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerColumn: {
    height: ITEM_HEIGHT * 3,
    width: 50,
  },
  pickerContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {},
  pickerItemText: {
    fontSize: SIZES.h3,
  },
  pickerItemTextSelected: {
    fontWeight: '600',
  },
  pickerSeparator: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    marginHorizontal: SIZES.xs,
  },
  arrowContainer: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.lg,
  },
  previewText: {
    fontSize: SIZES.title,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

const defaultStyles = StyleSheet.create({
  container: { backgroundColor: COLORS.white, ...SHADOWS.lg },
  title: { color: COLORS.textOnLight },
  pickerLabel: { color: COLORS.textSecondary },
  pickerItemSelected: { backgroundColor: COLORS.backgroundInput, borderRadius: SIZES.radiusSm },
  pickerItemText: { color: COLORS.textMuted },
  pickerItemTextSelected: { color: COLORS.textOnLight },
  pickerSeparator: { color: COLORS.textOnLight },
  previewContainer: { backgroundColor: COLORS.backgroundInput },
  previewText: { color: COLORS.textOnLight },
  cancelButton: { borderColor: COLORS.border },
  cancelButtonText: { color: COLORS.textOnLight },
  confirmButton: { backgroundColor: COLORS.primary },
  confirmButtonText: { color: COLORS.white },
});

const riderStyles = StyleSheet.create({
  container: { backgroundColor: COLORS.riderCard, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.text },
  pickerLabel: { color: COLORS.textSecondary },
  pickerItemSelected: { backgroundColor: COLORS.riderNavy, borderRadius: SIZES.radiusSm },
  pickerItemText: { color: COLORS.textMuted },
  pickerItemTextSelected: { color: COLORS.riderBlueMuted },
  pickerSeparator: { color: COLORS.text },
  previewContainer: { backgroundColor: COLORS.riderNavy },
  previewText: { color: COLORS.text },
  cancelButton: { borderColor: COLORS.border, backgroundColor: COLORS.riderNavy },
  cancelButtonText: { color: COLORS.textSecondary },
  confirmButton: { backgroundColor: COLORS.riderBlue },
  confirmButtonText: { color: COLORS.white },
});

export default TimePickerModal;
