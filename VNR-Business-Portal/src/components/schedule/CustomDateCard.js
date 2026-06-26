import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import TimeRangeItem from './TimeRangeItem';

/**
 * CustomDateCard - Tarjeta para mostrar fechas específicas con horarios personalizados
 */
const CustomDateCard = ({
  startDate,
  endDate,
  timeRanges = [],
  onEdit,
  onDelete,
  onAddTimeRange,
  onEditTimeRange,
  onDeleteTimeRange,
}) => {
  // Formatear fecha para mostrar
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  };

  const isRange = endDate && endDate !== startDate;

  return (
    <View style={styles.container}>
      {/* Header con fecha y botón eliminar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dateContainer}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={18} color={COLORS.text} />
          <Text style={styles.dateText}>
            {formatDate(startDate)}
            {isRange && ` - ${formatDate(endDate)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Rangos horarios */}
      <View style={styles.timeRangesContainer}>
        {timeRanges.length > 0 ? (
          <View style={styles.timeRangesList}>
            {timeRanges.map((range, index) => (
              <TimeRangeItem
                key={range.id || index}
                startTime={range.start_time}
                endTime={range.end_time}
                onEdit={() => onEditTimeRange?.(range, index)}
                onDelete={() => onDeleteTimeRange?.(range, index)}
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
        ) : (
          <View style={styles.noRangesContainer}>
            <Text style={styles.noRangesText}>
              No disponible este día
            </Text>
            <TouchableOpacity
              style={styles.addRangeButton}
              onPress={onAddTimeRange}
              activeOpacity={0.7}
            >
              <Text style={styles.addRangeButtonText}>
                Agregar horario
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  deleteButton: {
    padding: SIZES.xs,
  },
  timeRangesContainer: {
    marginTop: SIZES.xs,
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
  noRangesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noRangesText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  addRangeButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusSm,
  },
  addRangeButtonText: {
    fontSize: SIZES.small,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default CustomDateCard;
