import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const WEEKDAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const RiderCalendarModal = ({
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
    if (!visible) return;
    setStartDate(initialStartDate ? new Date(initialStartDate) : null);
    setEndDate(initialEndDate ? new Date(initialEndDate) : null);
    setCurrentMonth(initialStartDate ? new Date(initialStartDate) : new Date());
  }, [visible, initialStartDate, initialEndDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i -= 1) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      });
    }
    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i += 1) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + direction);
    setCurrentMonth(next);
  };

  const handleDayPress = (dayData) => {
    const { date } = dayData;
    if (minDate && toDateKey(date) < minDate) return;

    if (!allowRange) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (date < startDate) {
      setStartDate(date);
      setEndDate(null);
    } else {
      setEndDate(date);
    }
  };

  const isDateSelected = (date) => {
    if (!startDate) return false;
    const key = toDateKey(date);
    const startKey = toDateKey(startDate);
    if (!endDate) return key === startKey;
    const endKey = toDateKey(endDate);
    return key === startKey || key === endKey;
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    const key = toDateKey(date);
    return key > toDateKey(startDate) && key < toDateKey(endDate);
  };

  const isDateDisabled = (date) => {
    if (!minDate) return false;
    return toDateKey(date) < minDate;
  };

  const handleConfirm = () => {
    if (!startDate) return;
    onConfirm(toDateKey(startDate), endDate ? toDateKey(endDate) : toDateKey(startDate));
    onClose();
  };

  const formatDateRange = () => {
    if (!startDate) return 'Seleccioná una fecha';
    const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
    if (!endDate || toDateKey(startDate) === toDateKey(endDate)) return fmt(startDate);
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  };

  const days = getDaysInMonth(currentMonth);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((dayData, dayIndex) => {
                  const selected = isDateSelected(dayData.date);
                  const inRange = isDateInRange(dayData.date);
                  const disabled = isDateDisabled(dayData.date);
                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        styles.dayCell,
                        selected && styles.dayCellSelected,
                        inRange && styles.dayCellInRange,
                        disabled && styles.dayCellDisabled,
                      ]}
                      onPress={() => handleDayPress(dayData)}
                      disabled={disabled}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !dayData.isCurrentMonth && styles.dayTextMuted,
                          selected && styles.dayTextSelected,
                          inRange && styles.dayTextInRange,
                        ]}
                      >
                        {dayData.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.selectedBox}>
            <Text style={styles.selectedLabel}>Seleccionado</Text>
            <Text style={styles.selectedValue}>{formatDateRange()}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !startDate && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!startDate}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const CELL = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.screenPadding,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  title: {
    flex: 1,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.riderNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: SIZES.xs,
  },
  weekdayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.riderLabel,
    letterSpacing: 0.5,
  },
  daysGrid: {
    marginBottom: SIZES.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL / 2,
  },
  dayCellSelected: {
    backgroundColor: COLORS.riderBlue,
  },
  dayCellInRange: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  dayTextMuted: {
    color: COLORS.textMuted,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  dayTextInRange: {
    color: COLORS.riderBlueMuted,
    fontWeight: '600',
  },
  selectedBox: {
    backgroundColor: COLORS.riderNavy,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectedValue: {
    marginTop: 2,
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.riderNavy,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: SIZES.body,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.riderBlue,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: SIZES.body,
  },
});

export default RiderCalendarModal;
