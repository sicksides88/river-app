import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const DAYS = [
  { id: 0, name: 'Domingo', short: 'D' },
  { id: 1, name: 'Lunes', short: 'L' },
  { id: 2, name: 'Martes', short: 'M' },
  { id: 3, name: 'Miércoles', short: 'M' },
  { id: 4, name: 'Jueves', short: 'J' },
  { id: 5, name: 'Viernes', short: 'V' },
  { id: 6, name: 'Sábado', short: 'S' },
];

/**
 * CopyScheduleModal - Modal para copiar horario a otros días
 */
const CopyScheduleModal = ({
  visible,
  onClose,
  onConfirm,
  sourceDay,
  excludeDays = [],
}) => {
  const [selectedDays, setSelectedDays] = useState([]);

  const toggleDay = (dayId) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const selectAll = () => {
    const availableDays = DAYS
      .filter((day) => day.id !== sourceDay && !excludeDays.includes(day.id))
      .map((day) => day.id);
    setSelectedDays(availableDays);
  };

  const clearAll = () => {
    setSelectedDays([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedDays);
    setSelectedDays([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedDays([]);
    onClose();
  };

  const sourceDayName = DAYS.find((d) => d.id === sourceDay)?.name || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.container}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Copiar horario</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Copiar el horario de <Text style={styles.highlightText}>{sourceDayName}</Text> a:
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={selectAll}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>Seleccionar todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={clearAll}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {DAYS.map((day) => {
              const isSource = day.id === sourceDay;
              const isExcluded = excludeDays.includes(day.id);
              const isSelected = selectedDays.includes(day.id);
              const isDisabled = isSource || isExcluded;

              return (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayItem,
                    isSelected && styles.dayItemSelected,
                    isDisabled && styles.dayItemDisabled,
                  ]}
                  onPress={() => !isDisabled && toggleDay(day.id)}
                  activeOpacity={0.7}
                  disabled={isDisabled}
                >
                  <View style={[
                    styles.dayBadge,
                    isSelected && styles.dayBadgeSelected,
                    isDisabled && styles.dayBadgeDisabled,
                  ]}>
                    <Text style={[
                      styles.dayBadgeText,
                      isSelected && styles.dayBadgeTextSelected,
                      isDisabled && styles.dayBadgeTextDisabled,
                    ]}>
                      {day.short}
                    </Text>
                  </View>
                  <Text style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                    isDisabled && styles.dayNameDisabled,
                  ]}>
                    {day.name}
                  </Text>
                  {isSource && (
                    <Text style={styles.sourceLabel}>(origen)</Text>
                  )}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.text} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                selectedDays.length === 0 && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={selectedDays.length === 0}
            >
              <Text style={[
                styles.confirmButtonText,
                selectedDays.length === 0 && styles.confirmButtonTextDisabled,
              ]}>
                Copiar ({selectedDays.length})
              </Text>
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
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  description: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  highlightText: {
    fontWeight: '600',
    color: COLORS.text,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  quickActionButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusSm,
  },
  quickActionText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    fontWeight: '500',
  },
  daysGrid: {
    marginBottom: SIZES.lg,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.xs,
  },
  dayItemSelected: {
    backgroundColor: COLORS.backgroundInput,
  },
  dayItemDisabled: {
    opacity: 0.5,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  dayBadgeSelected: {
    backgroundColor: COLORS.text,
  },
  dayBadgeDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  dayBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  dayBadgeTextSelected: {
    color: COLORS.white,
  },
  dayBadgeTextDisabled: {
    color: COLORS.textMuted,
  },
  dayName: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  dayNameSelected: {
    fontWeight: '500',
  },
  dayNameDisabled: {
    color: COLORS.textMuted,
  },
  sourceLabel: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginRight: SIZES.sm,
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
  confirmButtonDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  confirmButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
  },
  confirmButtonTextDisabled: {
    color: COLORS.textMuted,
  },
});

export default CopyScheduleModal;
