import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { RiderScreenShell, RiderPrimaryButton, RiderSectionLabel, RiderCalendarModal, RiderPuntualTypeSheet } from '../../components/rider';
import TimePickerModal from '../../components/modals/TimePickerModal';
import { scheduleService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import {
  RIDER_WEEKDAY_ORDER,
  RIDER_DAY_NAMES,
  getRiderDefaultWeeklySchedule,
  normalizeWeeklySchedule,
  formatTimeRangesLabel,
} from '../../utils/riderAvailability';

const GCAL_MOCK_KEY = '@rider_gcal_mock_connected';

const RiderDisponibilidadScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState(getRiderDefaultWeeklySchedule());
  const [customDates, setCustomDates] = useState([]);
  const [gcalConnected, setGcalConnected] = useState(false);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [editingCustomId, setEditingCustomId] = useState(null);
  const [puntualTypeVisible, setPuntualTypeVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [pendingPuntualType, setPendingPuntualType] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [scheduleRes, gcal] = await Promise.all([
        scheduleService.getSchedule().catch(() => null),
        AsyncStorage.getItem(GCAL_MOCK_KEY),
      ]);
      setGcalConnected(gcal === '1');
      if (scheduleRes?.schedule) {
        setWeeklySchedule(normalizeWeeklySchedule(scheduleRes.schedule.weekly_schedule));
        setCustomDates(scheduleRes.schedule.custom_dates || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const getDayEntry = (dayOfWeek) =>
    weeklySchedule.find((d) => d.day_of_week === dayOfWeek) ||
    { day_of_week: dayOfWeek, is_available: false, time_ranges: [] };

  const updateDay = (dayOfWeek, patch) => {
    setWeeklySchedule((prev) => {
      const next = [...prev];
      const idx = next.findIndex((d) => d.day_of_week === dayOfWeek);
      const base = idx >= 0 ? next[idx] : { day_of_week: dayOfWeek, is_available: false, time_ranges: [] };
      const updated = { ...base, ...patch };
      if (idx >= 0) next[idx] = updated;
      else next.push(updated);
      return next.sort((a, b) => a.day_of_week - b.day_of_week);
    });
  };

  const toggleDay = (dayOfWeek) => {
    const day = getDayEntry(dayOfWeek);
    const nextAvailable = !day.is_available;
    updateDay(dayOfWeek, {
      is_available: nextAvailable,
      time_ranges:
        nextAvailable && !day.time_ranges?.length
          ? [{ id: `range-${dayOfWeek}`, start_time: '08:00', end_time: '16:00' }]
          : day.time_ranges,
    });
  };

  const openTimeEditor = (dayOfWeek) => {
    const day = getDayEntry(dayOfWeek);
    if (!day.is_available) return;
    setEditingDay(dayOfWeek);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = (startTime, endTime) => {
    if (editingCustomId) {
      setCustomDates((prev) =>
        prev.map((cd) =>
          cd.id === editingCustomId
            ? {
                ...cd,
                time_ranges: [{ ...(cd.time_ranges?.[0] || { id: `extra-${cd.id}` }), start_time: startTime, end_time: endTime }],
              }
            : cd
        )
      );
      setEditingCustomId(null);
      setTimePickerVisible(false);
      return;
    }

    if (editingDay == null) return;
    const day = getDayEntry(editingDay);
    const range = day.time_ranges?.[0] || { id: `range-${editingDay}` };
    updateDay(editingDay, {
      is_available: true,
      time_ranges: [{ ...range, start_time: startTime, end_time: endTime }],
    });
    setEditingDay(null);
    setTimePickerVisible(false);
  };

  const startPuntualFlow = () => {
    setPuntualTypeVisible(true);
  };

  const handlePuntualTypeSelect = (type) => {
    setPendingPuntualType(type);
    setPuntualTypeVisible(false);
    setCalendarVisible(true);
  };

  const handleCalendarConfirm = (start, end) => {
    const type = pendingPuntualType || 'block';
    const entry = {
      id: `custom-${Date.now()}`,
      start_date: start,
      end_date: end,
      availability_type: type,
      time_ranges: type === 'extra' ? [{ id: `extra-${Date.now()}`, start_time: '08:00', end_time: '16:00' }] : [],
    };

    setCustomDates((prev) => [...prev, entry]);
    setPendingPuntualType(null);
    setCalendarVisible(false);

    if (type === 'extra') {
      setEditingCustomId(entry.id);
      setTimePickerVisible(true);
    }
  };

  const openCustomTimeEditor = (customId) => {
    setEditingCustomId(customId);
    setEditingDay(null);
    setTimePickerVisible(true);
  };

  const removeCustomDate = (id) => {
    Alert.alert('Eliminar', '¿Querés quitar esta fecha puntual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setCustomDates((prev) => prev.filter((d) => d.id !== id)),
      },
    ]);
  };

  const connectGoogleCalendar = async () => {
    await AsyncStorage.setItem(GCAL_MOCK_KEY, '1');
    setGcalConnected(true);
    Alert.alert(
      'Google Calendar conectado',
      'Modo demo: tus turnos tentativos se sincronizarán cuando la integración esté activa.'
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await scheduleService.updateSchedule({
        weekly_schedule: normalizeWeeklySchedule(weeklySchedule),
        custom_dates: customDates,
      });
      if (res?.success) {
        Alert.alert('Disponibilidad guardada', 'River Service usará esta semana tipo para asignarte turnos.');
        navigation.goBack();
      } else {
        Alert.alert('Error', res?.message || 'No se pudo guardar.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar la disponibilidad.');
    } finally {
      setSaving(false);
    }
  };

  const editingDayEntry = editingDay != null ? getDayEntry(editingDay) : null;
  const editingCustomEntry = editingCustomId
    ? customDates.find((cd) => cd.id === editingCustomId)
    : null;
  const editingRange = editingCustomEntry?.time_ranges?.[0] || editingDayEntry?.time_ranges?.[0];

  if (loading) {
    return (
      <RiderScreenShell title="Mi disponibilidad" onBack={() => navigation.goBack()}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.riderBlue} />
        </View>
      </RiderScreenShell>
    );
  }

  return (
    <RiderScreenShell
      title="Mi disponibilidad"
      subtitle="Definí tu semana tipo. River Service la usa para asignarte turnos recurrentes."
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <RiderSectionLabel>SEMANA TIPO · RECURRENTE</RiderSectionLabel>
        {RIDER_WEEKDAY_ORDER.map((dayOfWeek) => {
          const day = getDayEntry(dayOfWeek);
          const hoursLabel = formatTimeRangesLabel(day);
          return (
            <View key={dayOfWeek} style={styles.row}>
              <Text style={[styles.day, !day.is_available && styles.dayOff]}>
                {RIDER_DAY_NAMES[dayOfWeek]}
              </Text>
              <TouchableOpacity
                onPress={() => openTimeEditor(dayOfWeek)}
                disabled={!day.is_available}
                style={styles.hoursTap}
              >
                <Text style={[styles.hours, day.is_available && styles.hoursOn]}>{hoursLabel}</Text>
              </TouchableOpacity>
              <Switch
                value={day.is_available}
                onValueChange={() => toggleDay(dayOfWeek)}
                trackColor={{ false: COLORS.border, true: COLORS.riderBlue }}
                thumbColor={COLORS.white}
              />
            </View>
          );
        })}

        <View style={styles.sectionGap}>
          <RiderSectionLabel>FECHAS PUNTUALES</RiderSectionLabel>
        </View>
        <TouchableOpacity style={styles.puntualRow} onPress={startPuntualFlow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.riderBlue} />
          <Text style={styles.puntualText}>Agregar día puntual (no disponible o extra)</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {customDates.map((cd) => {
          const isBlock = cd.availability_type === 'block' || (!cd.availability_type && !cd.time_ranges?.length);
          const rangeLabel = isBlock
            ? 'No disponible'
            : formatTimeRangesLabel({ is_available: true, time_ranges: cd.time_ranges });
          return (
            <View key={cd.id} style={styles.customCard}>
              <TouchableOpacity
                style={styles.customBody}
                onPress={() => !isBlock && openCustomTimeEditor(cd.id)}
                disabled={isBlock}
                activeOpacity={isBlock ? 1 : 0.7}
              >
                <Text style={styles.customTitle}>
                  {cd.start_date === cd.end_date || !cd.end_date
                    ? cd.start_date
                    : `${cd.start_date} → ${cd.end_date}`}
                </Text>
                <Text style={[styles.customSub, isBlock && styles.customBlock]}>
                  {isBlock ? 'Bloqueado' : 'Extra'} · {rangeLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeCustomDate(cd.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.sectionGap}>
          <RiderSectionLabel>SINCRONIZACIÓN</RiderSectionLabel>
        </View>
        <View style={styles.syncCard}>
          <View style={styles.syncIconWrap}>
            <Ionicons name="calendar" size={20} color={COLORS.riderBlue} />
          </View>
          <View style={styles.syncBody}>
            <Text style={styles.syncTitle}>Conectar con Google Calendar</Text>
            <Text style={styles.syncSub}>
              Tus turnos tentativos van a tu calendario y se confirman como invitación.
            </Text>
            {gcalConnected && (
              <Text style={styles.syncConnected}>Conectado (demo)</Text>
            )}
          </View>
          {!gcalConnected && (
            <RiderPrimaryButton
              title="Conectar"
              variant="outline"
              onPress={connectGoogleCalendar}
              style={styles.syncBtn}
            />
          )}
        </View>

        <RiderPrimaryButton
          title={saving ? 'Guardando…' : 'Guardar disponibilidad'}
          onPress={save}
          disabled={saving}
          style={styles.save}
        />
      </ScrollView>

      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => {
          setTimePickerVisible(false);
          setEditingDay(null);
          setEditingCustomId(null);
        }}
        onConfirm={handleTimeConfirm}
        initialStartTime={editingRange?.start_time || '08:00'}
        initialEndTime={editingRange?.end_time || '16:00'}
        title={
          editingCustomId
            ? 'Horario · día extra'
            : `Horario · ${editingDay != null ? RIDER_DAY_NAMES[editingDay] : ''}`
        }
        variant="rider"
      />

      <RiderPuntualTypeSheet
        visible={puntualTypeVisible}
        onClose={() => setPuntualTypeVisible(false)}
        onSelect={handlePuntualTypeSelect}
      />

      <RiderCalendarModal
        visible={calendarVisible}
        onClose={() => {
          setCalendarVisible(false);
          setPendingPuntualType(null);
        }}
        onConfirm={handleCalendarConfirm}
        title={pendingPuntualType === 'extra' ? 'Elegí el día extra' : 'Elegí el día no disponible'}
        allowRange
        minDate={new Date().toISOString().slice(0, 10)}
      />
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  day: { flex: 1, color: COLORS.text, fontWeight: '600' },
  dayOff: { color: COLORS.textMuted },
  hoursTap: { marginRight: SIZES.md, maxWidth: 130 },
  hours: { color: COLORS.textMuted, fontSize: SIZES.caption, textAlign: 'right' },
  hoursOn: { color: COLORS.riderBlue, fontWeight: '600' },
  sectionGap: { marginTop: SIZES.lg },
  puntualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.riderCard,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  puntualText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.caption },
  customCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customBody: { flex: 1 },
  customTitle: { color: COLORS.text, fontWeight: '600' },
  customSub: { color: COLORS.riderBlue, fontSize: SIZES.caption, marginTop: 2 },
  customBlock: { color: COLORS.riderOrange },
  syncCard: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  syncIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  syncBody: { marginBottom: SIZES.sm },
  syncTitle: { color: COLORS.text, fontWeight: '700' },
  syncSub: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 4, lineHeight: 18 },
  syncConnected: { color: COLORS.success, fontSize: SIZES.caption, marginTop: 6, fontWeight: '600' },
  syncBtn: { alignSelf: 'flex-start' },
  save: { marginTop: SIZES.md },
});

export default RiderDisponibilidadScreen;
