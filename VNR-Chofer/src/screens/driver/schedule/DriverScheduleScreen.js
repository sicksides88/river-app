import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { scheduleService } from '../../../services';
import { DayScheduleRow, CustomDateCard } from '../../../components/schedule';
import TimePickerModal from '../../../components/modals/TimePickerModal';
import CalendarModal from '../../../components/modals/CalendarModal';
import CopyScheduleModal from '../../../components/modals/CopyScheduleModal';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORTS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const DriverScheduleScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAuth();
  const { isOnboarding = false, serviceType } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [customDates, setCustomDates] = useState([]);
  const [bookingConfig, setBookingConfig] = useState({
    max_advance_days: 60,
    min_notice_hours: 4,
    buffer_days: 10,
    buffer_type: 'calendar',
  });

  // Estados de modales
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);

  // Estado para edición actual
  const [editingDay, setEditingDay] = useState(null);
  const [editingTimeRangeIndex, setEditingTimeRangeIndex] = useState(null);
  const [editingCustomDateIndex, setEditingCustomDateIndex] = useState(null);
  const [copySourceDay, setCopySourceDay] = useState(null);

  // Cargar horario
  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getSchedule();

      if (response.success) {
        setWeeklySchedule(response.schedule.weekly_schedule || scheduleService.getDefaultSchedule().weekly_schedule);
        setCustomDates(response.schedule.custom_dates || []);
        setBookingConfig(response.schedule.booking_config || scheduleService.getDefaultSchedule().booking_config);
      } else {
        // Usar valores por defecto
        const defaults = scheduleService.getDefaultSchedule();
        setWeeklySchedule(defaults.weekly_schedule);
        setCustomDates(defaults.custom_dates);
        setBookingConfig(defaults.booking_config);
      }
    } catch (error) {
      console.error('Error cargando horario:', error);
      // Usar valores por defecto en caso de error
      const defaults = scheduleService.getDefaultSchedule();
      setWeeklySchedule(defaults.weekly_schedule);
      setCustomDates(defaults.custom_dates);
      setBookingConfig(defaults.booking_config);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [])
  );

  // Guardar horario
  const saveSchedule = async () => {
    try {
      setSaving(true);
      const response = await scheduleService.updateSchedule({
        weekly_schedule: weeklySchedule,
        custom_dates: customDates,
        booking_config: bookingConfig,
      });

      if (response.success) {
        if (isOnboarding) {
          // Último paso del alta: completar onboarding y entrar a la app.
          try {
            await updateProfile({ onboarding_completed: true });
          } catch (e) {
            console.log('Error completando onboarding:', e?.message);
          }
          navigation.reset({ index: 0, routes: [{ name: 'DriverMain' }] });
        } else {
          Alert.alert('Guardado', 'Tu disponibilidad ha sido actualizada');
        }
      } else {
        Alert.alert('Error', response.message || 'No se pudo guardar el horario');
      }
    } catch (error) {
      console.error('Error guardando horario:', error);
      Alert.alert('Error', 'No se pudo guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  // Toggle disponibilidad de un día
  const handleToggleDay = (dayIndex) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        is_available: !updated[dayIndex].is_available,
        // Si se activa y no tiene rangos, agregar uno por defecto
        time_ranges: !updated[dayIndex].is_available && updated[dayIndex].time_ranges.length === 0
          ? [{ id: `range-${Date.now()}`, start_time: '09:00', end_time: '18:00' }]
          : updated[dayIndex].time_ranges,
      };
      return updated;
    });
  };

  // Agregar rango horario a un día
  const handleAddTimeRange = (dayIndex) => {
    setEditingDay(dayIndex);
    setEditingTimeRangeIndex(null);
    setTimePickerVisible(true);
  };

  // Editar rango horario
  const handleEditTimeRange = (dayIndex, range, rangeIndex) => {
    setEditingDay(dayIndex);
    setEditingTimeRangeIndex(rangeIndex);
    setTimePickerVisible(true);
  };

  // Eliminar rango horario
  const handleDeleteTimeRange = (dayIndex, rangeIndex) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        time_ranges: updated[dayIndex].time_ranges.filter((_, i) => i !== rangeIndex),
      };
      return updated;
    });
  };

  // Confirmar selección de tiempo
  const handleTimeConfirm = (startTime, endTime) => {
    if (editingDay === null) return;

    setWeeklySchedule((prev) => {
      const updated = [...prev];
      const newRange = {
        id: `range-${Date.now()}`,
        start_time: startTime,
        end_time: endTime,
      };

      if (editingTimeRangeIndex !== null) {
        // Editar existente
        updated[editingDay].time_ranges[editingTimeRangeIndex] = newRange;
      } else {
        // Agregar nuevo
        updated[editingDay].time_ranges.push(newRange);
      }

      return updated;
    });

    setEditingDay(null);
    setEditingTimeRangeIndex(null);
  };

  // Abrir modal de copiar
  const handleOpenCopyModal = (dayIndex) => {
    setCopySourceDay(dayIndex);
    setCopyModalVisible(true);
  };

  // Confirmar copia de horario
  const handleCopyConfirm = (targetDays) => {
    if (copySourceDay === null) return;

    const sourceDay = weeklySchedule[copySourceDay];

    setWeeklySchedule((prev) => {
      const updated = [...prev];
      targetDays.forEach((dayIndex) => {
        updated[dayIndex] = {
          ...updated[dayIndex],
          is_available: true,
          time_ranges: sourceDay.time_ranges.map((range, i) => ({
            ...range,
            id: `range-${Date.now()}-${i}`,
          })),
        };
      });
      return updated;
    });

    setCopySourceDay(null);
  };

  // Agregar fecha personalizada
  const handleAddCustomDate = () => {
    setEditingCustomDateIndex(null);
    setCalendarVisible(true);
  };

  // Confirmar fecha del calendario
  const handleCalendarConfirm = (startDate, endDate) => {
    const newCustomDate = {
      id: `custom-${Date.now()}`,
      start_date: startDate,
      end_date: endDate,
      time_ranges: [],
    };

    if (editingCustomDateIndex !== null) {
      setCustomDates((prev) => {
        const updated = [...prev];
        updated[editingCustomDateIndex] = {
          ...updated[editingCustomDateIndex],
          start_date: startDate,
          end_date: endDate,
        };
        return updated;
      });
    } else {
      setCustomDates((prev) => [...prev, newCustomDate]);
    }

    setEditingCustomDateIndex(null);
  };

  // Eliminar fecha personalizada
  const handleDeleteCustomDate = (index) => {
    Alert.alert(
      'Eliminar fecha',
      '¿Estás seguro de eliminar esta fecha personalizada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setCustomDates((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  // Agregar rango horario a fecha personalizada
  const handleAddCustomDateTimeRange = (customIndex) => {
    setCustomDates((prev) => {
      const updated = [...prev];
      updated[customIndex].time_ranges.push({
        id: `range-${Date.now()}`,
        start_time: '09:00',
        end_time: '18:00',
      });
      return updated;
    });
  };

  // Obtener rango horario actual para el modal
  const getCurrentTimeRange = () => {
    if (editingDay === null) return { start: '09:00', end: '18:00' };

    const day = weeklySchedule[editingDay];
    if (editingTimeRangeIndex !== null && day.time_ranges[editingTimeRangeIndex]) {
      const range = day.time_ranges[editingTimeRangeIndex];
      return { start: range.start_time, end: range.end_time };
    }

    // Para nuevo rango, sugerir después del último
    if (day.time_ranges.length > 0) {
      const lastRange = day.time_ranges[day.time_ranges.length - 1];
      return { start: lastRange.end_time, end: '23:00' };
    }

    return { start: '09:00', end: '18:00' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Cargando disponibilidad...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Disponibilidad</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Explicación: cómo funciona VNR para el chofer */}
        <View style={{ backgroundColor: COLORS.backgroundTertiary, borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="information-circle" size={22} color={COLORS.text} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginLeft: 8 }}>
              ¿Por qué te pedimos tus horarios?
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, marginBottom: 8 }}>
            En VNR no solo hay viajes al instante: los usuarios también pueden{' '}
            <Text style={{ fontWeight: '700', color: COLORS.text }}>reservar tus servicios con anticipación</Text>.
            Por ejemplo, alguien puede contratarte como conductor designado para el{' '}
            <Text style={{ fontWeight: '700', color: COLORS.text }}>próximo sábado a la madrugada</Text>, o un envío para dentro de unos días.
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, marginBottom: 12 }}>
            Indicá los días y horas en los que solés estar disponible y la app{' '}
            <Text style={{ fontWeight: '700', color: COLORS.text }}>solo te ofrecerá viajes cuando realmente puedas tomarlos</Text>.
          </Text>
          {[
            ['time-outline', 'Recibís solicitudes solo dentro de los horarios que elijas.'],
            ['calendar-outline', 'Los usuarios pueden reservarte con días de anticipación.'],
            ['sync-outline', 'No es definitivo: lo cambiás cuando quieras desde tu perfil.'],
          ].map(([icon, txt]) => (
            <View key={txt} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
              <Ionicons name={icon} size={16} color={COLORS.text} style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 13.5, color: COLORS.textSecondary, marginLeft: 8, flex: 1, lineHeight: 19 }}>{txt}</Text>
            </View>
          ))}
        </View>

        {/* Sección: Horario Semanal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horario Semanal</Text>
          <Text style={styles.sectionSubtitle}>
            Define tu disponibilidad regular para cada día de la semana
          </Text>

          {weeklySchedule.map((day, index) => (
            <DayScheduleRow
              key={index}
              dayName={DAY_NAMES[day.day_of_week]}
              dayShort={DAY_SHORTS[day.day_of_week]}
              isAvailable={day.is_available}
              timeRanges={day.time_ranges}
              onToggle={() => handleToggleDay(index)}
              onAddTimeRange={() => handleAddTimeRange(index)}
              onEditTimeRange={(range, rangeIndex) => handleEditTimeRange(index, range, rangeIndex)}
              onDeleteTimeRange={(range, rangeIndex) => handleDeleteTimeRange(index, rangeIndex)}
              onCopy={() => handleOpenCopyModal(index)}
            />
          ))}
        </View>

        {/* Sección: Fechas Específicas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Fechas Específicas</Text>
              <Text style={styles.sectionSubtitle}>
                Agrega excepciones para días particulares
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCustomDate}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {customDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyStateText}>
                No hay fechas específicas configuradas
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddCustomDate}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyStateButtonText}>
                  Agregar fecha
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            customDates.map((customDate, index) => (
              <CustomDateCard
                key={customDate.id || index}
                startDate={customDate.start_date}
                endDate={customDate.end_date}
                timeRanges={customDate.time_ranges}
                onDelete={() => handleDeleteCustomDate(index)}
                onAddTimeRange={() => handleAddCustomDateTimeRange(index)}
              />
            ))
          )}
        </View>

        {/* Sección: Configuración de Reservas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Reservas</Text>
          <Text style={styles.sectionSubtitle}>
            Ajusta cómo los clientes pueden reservar tu servicio
          </Text>

          <View style={styles.configCard}>
            {/* Máximo días de anticipación */}
            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Días de anticipación</Text>
                <Text style={styles.configHint}>
                  Máximo de días en el futuro para reservar
                </Text>
              </View>
              <View style={styles.configValue}>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => setBookingConfig((prev) => ({
                    ...prev,
                    max_advance_days: Math.max(7, prev.max_advance_days - 10),
                  }))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.configValueText}>
                  {bookingConfig.max_advance_days}
                </Text>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => setBookingConfig((prev) => ({
                    ...prev,
                    max_advance_days: Math.min(365, prev.max_advance_days + 10),
                  }))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Antelación mínima */}
            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Antelación mínima</Text>
                <Text style={styles.configHint}>
                  Horas antes para aceptar reservas
                </Text>
              </View>
              <View style={styles.configValue}>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => setBookingConfig((prev) => ({
                    ...prev,
                    min_notice_hours: Math.max(0, prev.min_notice_hours - 1),
                  }))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.configValueText}>
                  {bookingConfig.min_notice_hours}h
                </Text>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => setBookingConfig((prev) => ({
                    ...prev,
                    min_notice_hours: Math.min(168, prev.min_notice_hours + 1),
                  }))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Días de preparación */}
            <View style={[styles.configRow, { borderBottomWidth: 0 }]}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Días de preparación</Text>
                <Text style={styles.configHint}>
                  Días antes del evento para confirmar
                </Text>
              </View>
              <View style={styles.configValue}>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => setBookingConfig((prev) => ({
                    ...prev,
                    buffer_days: Math.max(0, prev.buffer_days - 1),
                  }))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.configValueText}>
                  {bookingConfig.buffer_days}
                </Text>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => setBookingConfig((prev) => ({
                    ...prev,
                    buffer_days: Math.min(30, prev.buffer_days + 1),
                  }))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer con botón guardar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 65 + SIZES.md }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSchedule}
          activeOpacity={0.8}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isOnboarding ? 'Continuar' : 'Guardar cambios'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modales */}
      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => {
          setTimePickerVisible(false);
          setEditingDay(null);
          setEditingTimeRangeIndex(null);
        }}
        onConfirm={handleTimeConfirm}
        initialStartTime={getCurrentTimeRange().start}
        initialEndTime={getCurrentTimeRange().end}
        title={editingTimeRangeIndex !== null ? 'Editar horario' : 'Agregar horario'}
      />

      <CalendarModal
        visible={calendarVisible}
        onClose={() => {
          setCalendarVisible(false);
          setEditingCustomDateIndex(null);
        }}
        onConfirm={handleCalendarConfirm}
        allowRange={true}
        title="Seleccionar fechas"
        minDate={new Date().toISOString().split('T')[0]}
      />

      <CopyScheduleModal
        visible={copyModalVisible}
        onClose={() => {
          setCopyModalVisible(false);
          setCopySourceDay(null);
        }}
        onConfirm={handleCopyConfirm}
        sourceDay={copySourceDay}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.lg,
    paddingBottom: 120,
  },
  description: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    marginBottom: SIZES.xl,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.md,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
  },
  emptyStateText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.textMuted,
    marginBottom: SIZES.md,
  },
  emptyStateButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusFull,
  },
  emptyStateButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.primary,
  },
  configCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  configInfo: {
    flex: 1,
    marginRight: SIZES.md,
  },
  configLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  configHint: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
  },
  configValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  configButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configValueText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 50,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  saveButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default DriverScheduleScreen;
