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

// FiltroMarketplaceModal - Modal de filtros para marketplace basado en Figma
const FiltroMarketplaceModal = ({ visible, onClose, onApply, initialFilters = {} }) => {
  const [fechas, setFechas] = useState(initialFilters.fechas || '');
  const [horarios, setHorarios] = useState(initialFilters.horarios || '');
  const [metodosPago, setMetodosPago] = useState(initialFilters.metodosPago || '');

  const handleApply = () => {
    onApply?.({
      fechas,
      horarios,
      metodosPago,
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
          {/* Fechas */}
          <TouchableOpacity style={styles.filterItem} activeOpacity={0.7}>
            <Text style={styles.filterText}>Fechas</Text>
          </TouchableOpacity>

          {/* Horarios */}
          <TouchableOpacity style={styles.filterItem} activeOpacity={0.7}>
            <Text style={styles.filterText}>Horarios</Text>
          </TouchableOpacity>

          {/* Métodos de pago */}
          <TouchableOpacity style={[styles.filterItem, styles.filterItemLast]} activeOpacity={0.7}>
            <Text style={styles.filterText}>Métodos de pago</Text>
          </TouchableOpacity>
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
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },

  // Filter Item
  filterItem: {
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterItemLast: {
    borderBottomWidth: 0,
  },
  filterText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
});

export default FiltroMarketplaceModal;
