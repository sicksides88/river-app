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
}) => {
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
            item === selectedValue && styles.pickerItemSelected,
          ]}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.pickerItemText,
            item === selectedValue && styles.pickerItemTextSelected,
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
          style={styles.container}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Pickers */}
          <View style={styles.pickersContainer}>
            {/* Inicio */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Desde</Text>
              <View style={styles.pickerRow}>
                {renderPicker(HOURS, startHour, setStartHour, startHourRef)}
                <Text style={styles.pickerSeparator}>:</Text>
                {renderPicker(MINUTES, startMinute, setStartMinute, startMinuteRef)}
              </View>
            </View>

            {/* Separador */}
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={24} color={COLORS.textMuted} />
            </View>

            {/* Fin */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Hasta</Text>
              <View style={styles.pickerRow}>
                {renderPicker(HOURS, endHour, setEndHour, endHourRef)}
                <Text style={styles.pickerSeparator}>:</Text>
                {renderPicker(MINUTES, endMinute, setEndMinute, endMinuteRef)}
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>
              {startHour}:{startMinute} - {endHour}:{endMinute}
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
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
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.lg,
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
    color: COLORS.text,
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
    color: COLORS.textSecondary,
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
  pickerItemSelected: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusSm,
  },
  pickerItemText: {
    fontSize: SIZES.h3,
    color: COLORS.textMuted,
  },
  pickerItemTextSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
  pickerSeparator: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: SIZES.xs,
  },
  arrowContainer: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.lg,
  },
  previewText: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.text,
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
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.text,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
  },
});

export default TimePickerModal;
