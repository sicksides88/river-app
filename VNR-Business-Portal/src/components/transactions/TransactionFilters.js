import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const TYPE_FILTERS = [
  { key: 'all', label: 'Todos', icon: 'apps' },
  { key: 'deposit', label: 'Recargas', icon: 'arrow-down-circle' },
  { key: 'withdrawal', label: 'Retiros', icon: 'arrow-up-circle' },
  { key: 'payment', label: 'Pagos', icon: 'cart' },
  { key: 'refund', label: 'Reembolsos', icon: 'refresh-circle' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'completed', label: 'Completado' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'failed', label: 'Fallido' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'Todo el tiempo' },
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'custom', label: 'Personalizado' },
];

/**
 * Componente de filtros para transacciones
 * Incluye filtros por tipo, estado, fecha y monto
 */
const TransactionFilters = ({
  filters,
  onFiltersChange,
  showAdvanced = false,
  onToggleAdvanced,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [datePreset, setDatePreset] = useState('all');

  const handleTypeChange = (type) => {
    const newFilters = { ...filters, type };
    onFiltersChange(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setShowModal(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      type: 'all',
      status: 'all',
      dateFrom: null,
      dateTo: null,
      minAmount: null,
      maxAmount: null,
    };
    setLocalFilters(resetFilters);
    setDatePreset('all');
    onFiltersChange(resetFilters);
    setShowModal(false);
  };

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    let dateFrom = null;
    let dateTo = now.toISOString();

    switch (preset) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        dateFrom = weekStart.toISOString();
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'all':
        dateFrom = null;
        dateTo = null;
        break;
      default:
        break;
    }

    setLocalFilters((prev) => ({ ...prev, dateFrom, dateTo }));
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      {/* Filtros de tipo (horizontal) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeFiltersContainer}
      >
        {TYPE_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.typeButton, filters.type === item.key && styles.typeButtonActive]}
            onPress={() => handleTypeChange(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={filters.type === item.key ? COLORS.white : COLORS.text}
              style={styles.typeIcon}
            />
            <Text
              style={[styles.typeText, filters.type === item.key && styles.typeTextActive]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Boton de filtros avanzados */}
        <TouchableOpacity
          style={[styles.advancedButton, activeFiltersCount() > 0 && styles.advancedButtonActive]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons
            name="options"
            size={18}
            color={activeFiltersCount() > 0 ? COLORS.white : COLORS.text}
          />
          {activeFiltersCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de filtros avanzados */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Estado */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Estado</Text>
                <View style={styles.optionsGrid}>
                  {STATUS_FILTERS.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.optionButton,
                        localFilters.status === item.key && styles.optionButtonActive,
                      ]}
                      onPress={() =>
                        setLocalFilters((prev) => ({ ...prev, status: item.key }))
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          localFilters.status === item.key && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Periodo */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Periodo</Text>
                <View style={styles.optionsGrid}>
                  {DATE_PRESETS.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.optionButton,
                        datePreset === item.key && styles.optionButtonActive,
                      ]}
                      onPress={() => handleDatePresetChange(item.key)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          datePreset === item.key && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rango de monto */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Rango de monto</Text>
                <View style={styles.amountRow}>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountLabel}>Min</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="$0"
                      keyboardType="numeric"
                      value={localFilters.minAmount?.toString() || ''}
                      onChangeText={(text) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          minAmount: text ? parseFloat(text) : null,
                        }))
                      }
                    />
                  </View>
                  <Text style={styles.amountSeparator}>-</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountLabel}>Max</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="$99999"
                      keyboardType="numeric"
                      value={localFilters.maxAmount?.toString() || ''}
                      onChangeText={(text) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          maxAmount: text ? parseFloat(text) : null,
                        }))
                      }
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                <Text style={styles.resetButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  typeFiltersContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
    alignItems: 'center',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.sm,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  typeTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  advancedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBody: {
    padding: SIZES.md,
  },
  filterSection: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  optionButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInputContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amountInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.body,
  },
  amountSeparator: {
    fontSize: SIZES.subtitle,
    color: COLORS.textMuted,
    marginHorizontal: SIZES.md,
    marginTop: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SIZES.md,
  },
  resetButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: SIZES.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default TransactionFilters;
