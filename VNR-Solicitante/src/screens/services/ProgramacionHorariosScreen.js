import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationInput } from '../../components/common';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// ProgramacionHorariosScreen - Programación de chofer con calendario basado en Figma
const ProgramacionHorariosScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(22);
  const [selectedMinute, setSelectedMinute] = useState(5);
  const [origin, setOrigin] = useState({ address: 'Independencia 156', coordinates: null });
  const [destination, setDestination] = useState(null);

  // Calendar data
  const currentMonth = 'Octubre 2025';
  const weekDays = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  const calendarDays = [
    [29, 30, 31, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, 31, 1],
  ];

  // Direcciones recientes
  const recentAddresses = [
    { id: '1', title: 'Urquiza 83', subtitle: 'Concepción del Uruguay, Entre Ríos' },
    { id: '2', title: 'UADER - Facultad de Ciencia y Tecnología', subtitle: '25 de mayo 385, Concepción del Uruguay, Entre Ríos' },
    { id: '3', title: 'Brown 634', subtitle: 'Concepción del Uruguay, Entre Ríos' },
    { id: '4', title: 'Avellaneda 482', subtitle: 'Concepción del Uruguay, Entre Ríos' },
    { id: '5', title: 'Juncal 1120', subtitle: 'Concepción del Uruguay, Entre Ríos' },
    { id: '6', title: 'Avenida Córdoba 2239', subtitle: 'Ciudad de Buenos Aires, Buenos Aires' },
  ];

  const handleAddressSelect = (item) => {
    const address = `${item.title}, ${item.subtitle}`;
    setDestination({ address, coordinates: null });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con botón atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Chofer</Text>

        {/* Tabs */}
        <View style={styles.headerRow}>
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

        {/* Calendar and Time Picker Row */}
        <View style={styles.dateTimeRow}>
          {/* Calendar */}
          <View style={styles.calendarContainer}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{currentMonth}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={styles.weekDaysRow}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Days */}
            {calendarDays.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = (weekIndex === 0 && day > 20) || (weekIndex === 4 && day < 10) ? false : true;
                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      style={styles.dayButton}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayText,
                        !isCurrentMonth && styles.dayTextMuted,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Time Picker */}
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerLabel}>Hora</Text>
              <Text style={styles.timePickerLabel}>Min</Text>
            </View>
            <View style={styles.timePickerValues}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeValueMuted}>21</Text>
                <Text style={styles.timeValueSelected}>22</Text>
                <Text style={styles.timeValueMuted}>23</Text>
              </View>
              <View style={styles.timeColumn}>
                <Text style={styles.timeValueMuted}>00</Text>
                <Text style={styles.timeValueSelected}>05</Text>
                <Text style={styles.timeValueMuted}>10</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.locationCardContainer}>
          <View style={styles.locationCard}>
            {/* Origin Row */}
            <View style={styles.locationRow}>
              <View style={styles.locationIconColumn}>
                <View style={styles.originDot} />
                <View style={styles.connectorLine} />
              </View>
              <View style={styles.locationInputWrapper}>
                <Text style={styles.locationText}>{origin?.address || 'Origen'}</Text>
              </View>
            </View>

            {/* Destination Row */}
            <View style={styles.locationRow}>
              <View style={styles.locationIconColumn}>
                <View style={styles.destinationDot} />
              </View>
              <View style={styles.locationInputWrapper}>
                <LocationInput
                  placeholder="¿A dónde vas?"
                  value={destination}
                  onLocationSelect={setDestination}
                  containerStyle={styles.locationInput}
                />
              </View>
            </View>
          </View>

        </View>

        {/* Recent Addresses */}
        <View style={styles.recentSection}>
          {recentAddresses.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentItem}
              onPress={() => handleAddressSelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={20} color={'rgba(255,255,255,0.7)'} style={styles.recentIcon} />
              <View style={styles.recentTextContainer}>
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.recentSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },

  // Title
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
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

  // Date Time Row
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: SIZES.lg,
  },

  // Calendar
  calendarContainer: {
    flex: 1,
    marginRight: SIZES.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  monthText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: SIZES.xs,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: SIZES.small,
    color: COLORS.white,
  },
  dayTextMuted: {
    color: 'rgba(255,255,255,0.55)',
  },

  // Time Picker
  timePickerContainer: {
    width: 100,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.sm,
  },
  timePickerLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  timePickerValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeValueMuted: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.55)',
    paddingVertical: SIZES.xs,
  },
  timeValueSelected: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.white,
    paddingVertical: SIZES.xs,
  },

  // Location Card
  locationCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  locationCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: 14,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: 'transparent',
  },
  connectorLine: {
    width: 0,
    height: 30,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginVertical: 4,
    marginLeft: 5,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  locationInputWrapper: {
    flex: 1,
    marginLeft: SIZES.sm,
    justifyContent: 'center',
    minHeight: 44,
  },
  locationText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationInput: {
    marginBottom: 0,
  },

  // Recent Addresses
  recentSection: {
    marginTop: SIZES.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  recentIcon: {
    marginRight: SIZES.md,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
  },
});

export default ProgramacionHorariosScreen;
