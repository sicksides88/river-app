import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderScreenShell, RiderPrimaryButton } from '../../components/rider';
import { patrolService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { mapPatrolShiftsToCards } from '../../utils/riderShifts';

const statusBadge = {
  en_curso: { text: 'En curso', color: COLORS.riderBlue },
  proximo: { text: 'Próximo', color: COLORS.riderBlue },
  pending_rs: { text: 'PENDIENTE DE CONFIRMACIÓN', color: COLORS.riderOrange },
  scheduled: { text: 'Programado', color: COLORS.textMuted },
};

const shiftIcon = (status) => {
  if (status === 'en_curso') return 'checkmark';
  if (status === 'pending_rs') return 'alert-circle';
  if (status === 'proximo') return 'boat-outline';
  return 'location-outline';
};

const MisTurnosScreen = ({ navigation }) => {
  const [shifts, setShifts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    try {
      const res = await patrolService.getMyShifts();
      const mapped = mapPatrolShiftsToCards(res?.shifts || []);
      setShifts(mapped);
    } catch {
      setShifts([]);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmShift = (shift) => {
    Alert.alert('Turno confirmado', `Confirmaste el turno en ${shift.base}.`);
    setShifts((prev) =>
      prev.map((s) => (s.id === shift.id ? { ...s, status: 'proximo', assignedByRs: false } : s))
    );
  };

  const rejectShift = (shift) => {
    Alert.alert('Turno rechazado', 'River Service fue notificado.');
    setShifts((prev) => prev.filter((s) => s.id !== shift.id));
  };

  return (
    <RiderScreenShell title="Mis Turnos" rightAction={<Ionicons name="calendar-outline" size={22} color={COLORS.riderBlue} />}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.riderBlue} />}
      >
        <TouchableOpacity style={styles.editCard} onPress={() => navigation.navigate('RiderDisponibilidad')}>
          <View style={styles.editIconWrap}>
            <Ionicons name="calendar" size={22} color={COLORS.riderBlue} />
          </View>
          <View style={styles.editText}>
            <Text style={styles.editTitle}>Editar disponibilidad</Text>
            <Text style={styles.editSub}>Definí tus días y horarios de guardia</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.riderBlue} />
        </TouchableOpacity>

        {loaded && shifts.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin turnos asignados</Text>
            <Text style={styles.emptySub}>
              Configurá tu disponibilidad para que River Service pueda asignarte guardias.
            </Text>
          </View>
        )}

        {shifts.map((s) => {
          const badge = statusBadge[s.status] || statusBadge.scheduled;
          const isPending = s.status === 'pending_rs';
          const isActive = s.status === 'en_curso';
          return (
            <View
              key={s.id}
              style={[
                styles.shiftCard,
                isPending && styles.shiftPending,
                isActive && styles.shiftActive,
              ]}
            >
              <Text style={[styles.dateHeader, s.assignedByRs && styles.dateOrange]}>
                {s.label} · {s.date}{s.assignedByRs ? ' · ASIGNADO POR RS' : ''}
              </Text>
              <View style={styles.shiftRow}>
                <View
                  style={[
                    styles.shiftIcon,
                    isPending && styles.shiftIconOrange,
                    isActive && styles.shiftIconActive,
                  ]}
                >
                  <Ionicons name={shiftIcon(s.status)} size={18} color={COLORS.white} />
                </View>
                <View style={styles.shiftBody}>
                  <Text style={styles.shiftBase}>{s.base}</Text>
                  <Text style={styles.shiftTime}>{s.time} · {s.boat}</Text>
                  {badge.text !== 'Programado' && (
                    <View style={[styles.badge, { backgroundColor: `${badge.color}22` }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  )}
                </View>
              </View>
              {isPending && (
                <View style={styles.pendingBox}>
                  <View style={styles.pendingInfoRow}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.riderBlue} />
                    <Text style={styles.pendingInfo}>
                      River Service te asignó este turno. ¿Confirmás disponibilidad?
                    </Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <RiderPrimaryButton title="Confirmar" onPress={() => confirmShift(s)} style={styles.pendingBtn} />
                    <RiderPrimaryButton
                      title="Rechazar"
                      variant="outline"
                      onPress={() => rejectShift(s)}
                      style={[styles.pendingBtn, styles.rejectBtn]}
                      textStyle={styles.rejectText}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  editCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.riderBlue,
    marginBottom: SIZES.lg,
  },
  editIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: { flex: 1 },
  editTitle: { color: COLORS.text, fontWeight: '700' },
  editSub: { color: COLORS.riderBlue, fontSize: SIZES.caption, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: SIZES.xxl, gap: SIZES.sm },
  emptyTitle: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.subtitle },
  emptySub: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: SIZES.lg },
  shiftCard: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shiftActive: { borderColor: COLORS.riderBlue },
  shiftPending: { borderColor: COLORS.riderOrange, borderWidth: 2 },
  dateHeader: { color: COLORS.riderLabel, fontSize: SIZES.caption, fontWeight: '700', marginBottom: SIZES.sm },
  dateOrange: { color: COLORS.riderOrange },
  shiftRow: { flexDirection: 'row', gap: SIZES.md },
  shiftIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftIconActive: { backgroundColor: COLORS.riderBlue },
  shiftIconOrange: { backgroundColor: COLORS.riderOrange },
  shiftBody: { flex: 1 },
  shiftBase: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.subtitle },
  shiftTime: { color: COLORS.textSecondary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: SIZES.radiusFull, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  pendingBox: {
    marginTop: SIZES.md,
    padding: SIZES.md,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  pendingInfoRow: { flexDirection: 'row', gap: SIZES.xs, marginBottom: SIZES.sm, alignItems: 'flex-start' },
  pendingInfo: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.caption, lineHeight: 18 },
  pendingActions: { flexDirection: 'row', gap: SIZES.sm },
  pendingBtn: { flex: 1 },
  rejectBtn: { borderColor: COLORS.error },
  rejectText: { color: COLORS.error },
});

export default MisTurnosScreen;
