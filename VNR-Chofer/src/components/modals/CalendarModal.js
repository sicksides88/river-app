import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const WEEKDAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * CalendarModal - Selector de fecha o rango de fechas
 */
const CalendarModal = ({
  visible,
  onClose,
  onConfirm,
  initialStartDate = null,
  initialEndDate = null,
  allowRange = true,
  title = 'Seleccionar fecha',
  minDate = null,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    if (visible) {
      setStartDate(initialStartDate ? new Date(initialStartDate) : null);
      setEndDate(initialEndDate ? new Date(initialEndDate) : null);
      setCurrentMonth(initialStartDate ? new Date(initialStartDate) : new Date());
    }
  }, [visible, initialStartDate, initialEndDate]);

  // Obtener días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajustar para que lunes sea 0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days = [];

    // Días del mes anterior
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Días del próximo mes
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const handleDayPress = (dayData) => {
    const { date } = dayData;

    // Validar fecha mínima
    if (minDate && date < new Date(minDate)) {
      return;
    }

    if (!allowRange) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      // Iniciar nueva selección
      setStartDate(date);
      setEndDate(null);
    } else if (date < startDate) {
      // Si selecciona antes del inicio, reiniciar
      setStartDate(date);
      setEndDate(null);
    } else {
      // Completar rango
      setEndDate(date);
    }
  };

  const isDateSelected = (date) => {
    if (!startDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    const startStr = startDate.toISOString().split('T')[0];
    if (!endDate) {
      return dateStr === startStr;
    }
    const endStr = endDate.toISOString().split('T')[0];
    return dateStr === startStr || dateStr === endStr;
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };

  const isDateDisabled = (date) => {
    if (!minDate) return false;
    return date < new Date(minDate);
  };

  const handleConfirm = () => {
    if (!startDate) return;
    const start = startDate.toISOString().split('T')[0];
    const end = endDate ? endDate.toISOString().split('T')[0] : start;
    onConfirm(start, end);
    onClose();
  };

  const formatDateRange = () => {
    if (!startDate) return 'Selecciona una fecha';

    const formatDate = (d) => {
      return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
    };

    if (!endDate || startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0]) {
      return formatDate(startDate);
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const days = getDaysInMonth(currentMonth);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

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

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Weekdays */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((dayData, dayIndex) => {
                  const selected = isDateSelected(dayData.date);
                  const inRange = isDateInRange(dayData.date);
                  const disabled = isDateDisabled(dayData.date);

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dayButton,
                        selected && styles.dayButtonSelected,
                        inRange && styles.dayButtonInRange,
                        disabled && styles.dayButtonDisabled,
                      ]}
                      onPress={() => handleDayPress(dayData)}
                      activeOpacity={0.7}
                      disabled={disabled}
                    >
                      <Text style={[
                        styles.dayText,
                        !dayData.isCurrentMonth && styles.dayTextMuted,
                        selected && styles.dayTextSelected,
                        inRange && styles.dayTextInRange,
                        disabled && styles.dayTextDisabled,
                      ]}>
                        {dayData.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Selected Range */}
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedLabel}>Seleccionado:</Text>
            <Text style={styles.selectedValue}>{formatDateRange()}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !startDate && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={!startDate}
            >
              <Text style={[
                styles.confirmButtonText,
                !startDate && styles.confirmButtonTextDisabled,
              ]}>
                Confirmar
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  navButton: {
    padding: SIZES.sm,
  },
  monthText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  daysGrid: {
    marginBottom: SIZES.md,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: SIZES.radiusFull,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  dayButtonInRange: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 0,
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  dayTextMuted: {
    color: COLORS.textMuted,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  dayTextInRange: {
    color: COLORS.text,
  },
  dayTextDisabled: {
    color: COLORS.textMuted,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.lg,
  },
  selectedLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginRight: SIZES.sm,
  },
  selectedValue: {
    fontSize: SIZES.body,
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
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  confirmButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.primary,
  },
  confirmButtonTextDisabled: {
    color: COLORS.textMuted,
  },
});

export default CalendarModal;
