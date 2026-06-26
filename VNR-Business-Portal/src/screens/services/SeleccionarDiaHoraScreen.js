import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// SeleccionarDiaHoraScreen - Selector de fecha/hora basado en Figma
const SeleccionarDiaHoraScreen = ({ navigation, route, visible, onClose, onConfirm }) => {
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' | 'fin'
  const [selectedDay, setSelectedDay] = useState(1); // Index of selected day
  const [selectedHour, setSelectedHour] = useState(22);
  const [selectedMinute, setSelectedMinute] = useState(5);

  // Generate days
  const days = [
    { label: 'Lun', value: 'lun' },
    { label: 'Hoy', value: 'hoy' },
    { label: 'Mie', value: 'mie' },
    { label: 'Jue', value: 'jue' },
    { label: 'Vie', value: 'vie' },
    { label: 'Sab', value: 'sab' },
    { label: 'Dom', value: 'dom' },
  ];

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate minutes (0-59, step 5)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    const selectedData = {
      type: activeTab,
      day: days[selectedDay],
      hour: selectedHour,
      minute: selectedMinute,
    };

    if (onConfirm) {
      onConfirm(selectedData);
    } else {
      navigation.goBack();
    }
  };

  const renderPickerColumn = (items, selectedIndex, onSelect, formatFn) => (
    <ScrollView
      style={styles.pickerColumn}
      showsVerticalScrollIndicator={false}
      snapToInterval={44}
      decelerationRate="fast"
    >
      <View style={styles.pickerSpacer} />
      {items.map((item, index) => {
        const isSelected = index === selectedIndex || item === selectedIndex;
        const label = formatFn ? formatFn(item) : item;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
            onPress={() => onSelect(formatFn ? item : index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.pickerSpacer} />
    </ScrollView>
  );

  const content = (
    <View style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inicio' && styles.tabActive]}
            onPress={() => setActiveTab('inicio')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'inicio' && styles.tabTextActive]}>
              Inicio del viaje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'fin' && styles.tabActive]}
            onPress={() => setActiveTab('fin')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'fin' && styles.tabTextActive]}>
              Fin del viaje
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.calendarButton} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Column Headers */}
      <View style={styles.columnHeaders}>
        <Text style={styles.columnHeader}>Día</Text>
        <Text style={styles.columnHeader}>Hora</Text>
        <Text style={styles.columnHeader}>Min</Text>
      </View>

      {/* Picker Columns */}
      <View style={styles.pickerContainer}>
        {/* Day Column */}
        {renderPickerColumn(
          days,
          selectedDay,
          setSelectedDay,
          (item) => item.label
        )}

        {/* Hour Column */}
        {renderPickerColumn(
          hours,
          selectedHour,
          setSelectedHour,
          (h) => h.toString().padStart(2, '0')
        )}

        {/* Minute Column */}
        {renderPickerColumn(
          minutes,
          selectedMinute,
          setSelectedMinute,
          (m) => m.toString().padStart(2, '0')
        )}

        {/* Selection Highlight */}
        <View style={styles.selectionHighlight} pointerEvents="none" />
      </View>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Confirmar"
          onPress={handleConfirm}
          fullWidth
        />
      </View>
    </View>
  );

  // If used as modal
  if (visible !== undefined) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  // If used as screen
  return (
    <SafeAreaView style={styles.screenContainer} edges={['top', 'bottom']}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusXl,
    padding: 4,
  },
  tab: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusXl - 4,
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.text,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Column Headers
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  columnHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Picker
  pickerContainer: {
    flexDirection: 'row',
    height: 180,
    position: 'relative',
  },
  pickerColumn: {
    flex: 1,
  },
  pickerSpacer: {
    height: 68,
  },
  pickerItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    // Handled by highlight
  },
  pickerItemText: {
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },
  pickerItemTextSelected: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectionHighlight: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    zIndex: -1,
  },

  // Button
  buttonContainer: {
    marginTop: SIZES.lg,
  },
});

export default SeleccionarDiaHoraScreen;
