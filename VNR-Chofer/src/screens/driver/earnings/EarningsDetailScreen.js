import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../constants/theme';

const { width } = Dimensions.get('window');

// Mock data para el gráfico
const mockChartData = [
  { day: 'Lun.', value: 40000, label: '3' },
  { day: 'Mar.', value: 30000, label: '4' },
  { day: 'Mié.', value: 35000, label: '5' },
  { day: 'Jue.', value: 25000, label: '6' },
  { day: 'Vie.', value: 50000, label: '7' },
  { day: 'Sáb.', value: 10000, label: '8' },
  { day: 'Dom.', value: 30000, label: '9' },
];

const filterOptions = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
  { id: 'custom', label: '14 oct - 23 oct' },
];

const EarningsDetailScreen = ({ navigation }) => {
  const [dateRange, setDateRange] = useState('3nov - 10 nov');
  const [total, setTotal] = useState(220000);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [chartData] = useState(mockChartData);

  const stats = {
    connected: '4 m 48 seg',
    trips: 0,
    points: 0,
  };

  const maxValue = Math.max(...chartData.map(d => d.value));
  const chartHeight = 180;

  const formatCurrency = (value) => {
    return '$' + value.toLocaleString('es-AR') + ',00';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date picker */}
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.datePickerText}>{dateRange}</Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.text} />
        </TouchableOpacity>

        {/* Total with navigation */}
        <View style={styles.totalRow}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.totalEarnings}>{formatCurrency(total)}</Text>

          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.yAxisLabel}>$50.000</Text>
            <Text style={styles.yAxisLabel}>$40.000</Text>
            <Text style={styles.yAxisLabel}>$30.000</Text>
            <Text style={styles.yAxisLabel}>$20.000</Text>
            <Text style={styles.yAxisLabel}>$10.000</Text>
            <Text style={styles.yAxisLabel}>$ 0,00</Text>
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                {/* Value label */}
                <Text style={styles.barValue}>
                  ${(item.value / 1000).toFixed(0)}.000
                </Text>

                {/* Bar */}
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.value / maxValue) * chartHeight,
                      },
                    ]}
                  />
                </View>

                {/* Day labels */}
                <Text style={styles.dayNumber}>{item.label}</Text>
                <Text style={styles.dayName}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Statistics */}
        <Text style={styles.sectionTitle}>Estadísticas</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Conectado</Text>
            <Text style={styles.statValue}>{stats.connected}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Viajes</Text>
            <Text style={styles.statValue}>{stats.trips}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValue}>{stats.points}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Filtrar fechas</Text>

            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.filterOption}
                onPress={() => {
                  setDateRange(option.label);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.filterOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    padding: SIZES.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
  },
  datePickerText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginRight: SIZES.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  navButton: {
    padding: SIZES.sm,
  },
  totalEarnings: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginHorizontal: SIZES.md,
  },
  chartContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.xl,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: SIZES.xs,
    height: 200,
  },
  yAxisLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 220,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 4,
  },
  barWrapper: {
    height: 180,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    minHeight: 4,
  },
  dayNumber: {
    fontSize: SIZES.small,
    color: COLORS.white,
    fontWeight: '500',
    marginTop: SIZES.xs,
  },
  dayName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.72)',
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.md,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  filterOption: {
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterOptionText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  applyButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  applyButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default EarningsDetailScreen;
