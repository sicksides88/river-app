import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

/**
 * TimeRangeItem - Muestra un rango horario (09:00 - 15:00)
 */
const TimeRangeItem = ({
  startTime,
  endTime,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <TouchableOpacity
        style={styles.timeContainer}
        onPress={onEdit}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.timeText, disabled && styles.textDisabled]}>
          {startTime}
        </Text>
        <Text style={[styles.separator, disabled && styles.textDisabled]}>
          -
        </Text>
        <Text style={[styles.timeText, disabled && styles.textDisabled]}>
          {endTime}
        </Text>
      </TouchableOpacity>

      {onDelete && !disabled && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginRight: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  separator: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
    marginHorizontal: SIZES.xs,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  deleteButton: {
    marginLeft: SIZES.sm,
  },
});

export default TimeRangeItem;
