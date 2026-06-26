import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import TimeRangeItem from './TimeRangeItem';

/**
 * DayScheduleRow - Fila de día con toggle y rangos horarios
 */
const DayScheduleRow = ({
  dayName,
  dayShort,
  isAvailable,
  timeRanges = [],
  onToggle,
  onEditTimeRange,
  onDeleteTimeRange,
  onAddTimeRange,
  onCopy,
}) => {
  return (
    <View style={styles.container}>
      {/* Header con día y toggle */}
      <View style={styles.header}>
        <View style={styles.dayInfo}>
          <View style={[
            styles.dayBadge,
            isAvailable && styles.dayBadgeActive,
          ]}>
            <Text style={[
              styles.dayBadgeText,
              isAvailable && styles.dayBadgeTextActive,
            ]}>
              {dayShort}
            </Text>
          </View>
          <Text style={styles.dayName}>{dayName}</Text>
        </View>

        <View style={styles.headerActions}>
          {isAvailable && onCopy && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={onCopy}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <Switch
            value={isAvailable}
            onValueChange={onToggle}
            trackColor={{ false: COLORS.border, true: COLORS.text }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.border}
          />
        </View>
      </View>

      {/* Rangos horarios (solo si está disponible) */}
      {isAvailable && (
        <View style={styles.timeRangesContainer}>
          <View style={styles.timeRangesList}>
            {timeRanges.map((range, index) => (
              <TimeRangeItem
                key={range.id || index}
                startTime={range.start_time}
                endTime={range.end_time}
                onEdit={() => onEditTimeRange(range, index)}
                onDelete={() => onDeleteTimeRange(range, index)}
              />
            ))}

            {/* Botón agregar rango */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddTimeRange}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mensaje cuando no está disponible */}
      {!isAvailable && (
        <Text style={styles.unavailableText}>No disponible</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dayBadgeActive: {
    backgroundColor: COLORS.text,
  },
  dayBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  dayBadgeTextActive: {
    color: COLORS.white,
  },
  dayName: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    marginRight: SIZES.md,
  },
  timeRangesContainer: {
    marginTop: SIZES.md,
  },
  timeRangesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});

export default DayScheduleRow;
