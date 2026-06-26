import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// FiltroChoferModal - Modal de filtros para chofer basado en Figma
const FiltroChoferModal = ({ visible, onClose, onApply, initialFilters = {} }) => {
  const [priceRange, setPriceRange] = useState(initialFilters.priceRange || [3000, 20000]);
  const [timeFrom, setTimeFrom] = useState(initialFilters.timeFrom || '09:00');
  const [timeTo, setTimeTo] = useState(initialFilters.timeTo || '12:30');
  const [vehicle, setVehicle] = useState(initialFilters.vehicle || '');
  const [rating, setRating] = useState(initialFilters.rating || '');

  const handleApply = () => {
    onApply?.({
      priceRange,
      timeFrom,
      timeTo,
      vehicle,
      rating,
    });
    onClose?.();
  };

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
          {/* Title */}
          <Text style={styles.title}>Filtrar por</Text>

          {/* Price Slider */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Precio</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>${priceRange[0].toLocaleString()}</Text>
              <Text style={styles.priceText}>${priceRange[1].toLocaleString()}</Text>
            </View>
            {/* Slider Track */}
            <View style={styles.sliderTrack}>
              <View style={styles.sliderFill} />
              <View style={[styles.sliderThumb, { left: '10%' }]} />
              <View style={[styles.sliderThumb, { left: '80%' }]} />
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Hora</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Desde</Text>
                <TouchableOpacity style={styles.timeInput} activeOpacity={0.7}>
                  <Text style={styles.timeInputText}>{timeFrom} hs</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Hasta</Text>
                <TouchableOpacity style={styles.timeInput} activeOpacity={0.7}>
                  <Text style={styles.timeInputText}>{timeTo} hs</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Vehicle Dropdown */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Vehículo</Text>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={[styles.dropdownText, !vehicle && styles.dropdownPlaceholder]}>
                {vehicle || 'Seleccionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Rating Dropdown */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Puntación</Text>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={[styles.dropdownText, !rating && styles.dropdownPlaceholder]}>
                {rating || 'Seleccionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Apply Button */}
          <Button
            title="Aplicar filtros"
            onPress={handleApply}
            fullWidth
            style={styles.applyButton}
          />
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

  // Title
  title: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },

  // Filter Section
  filterSection: {
    marginBottom: SIZES.lg,
  },
  filterLabel: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  priceText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: '10%',
    right: '20%',
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.text,
    marginLeft: -6,
  },

  // Time
  timeRow: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  timeInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  dropdownText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  dropdownPlaceholder: {
    color: COLORS.textMuted,
  },

  // Apply Button
  applyButton: {
    marginTop: SIZES.sm,
  },
});

export default FiltroChoferModal;
