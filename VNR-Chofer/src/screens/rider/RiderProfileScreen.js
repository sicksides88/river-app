import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getRiderDisplayName, getRiderInitials } from '../../utils/riderDisplay';
import { RiderScreenShell, RiderPrimaryButton } from '../../components/rider';
import { COLORS, SIZES } from '../../constants/theme';

const MENU = [
  { id: 'data', icon: 'person-outline', label: 'Mis datos', route: 'RiderMisDatos' },
  { id: 'unit', icon: 'boat-outline', label: 'Mi unidad de auxilio', route: 'MiUnidadAuxilio' },
  { id: 'notif', icon: 'notifications-outline', label: 'Notificaciones' },
  { id: 'help', icon: 'help-buoy-outline', label: 'Ayuda y soporte' },
  { id: 'legal', icon: 'document-text-outline', label: 'Términos y políticas' },
];

const RiderProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const initials = getRiderInitials(user);
  const displayName = getRiderDisplayName(user);

  return (
    <RiderScreenShell title="Perfil">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>Patrón Motor · Categoría 2</Text>
          </View>
          <TouchableOpacity><Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        </View>

        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.riderBlue} />
            <Text style={styles.docTitle}>DOCUMENTACIÓN</Text>
            <View style={styles.vigente}><Text style={styles.vigenteText}>VIGENTE</Text></View>
          </View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Libreta</Text><Text style={styles.docValue}>PNA-44218</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Vencimiento</Text><Text style={styles.docValueWhite}>15 / 03 / 2027</Text></View>
        </View>

        <View style={styles.stats}>
          {[
            { value: '284', label: 'auxilios', color: COLORS.text },
            { value: '4.9', label: 'calificación', color: COLORS.riderOrange },
            { value: '3 a', label: 'en RS', color: COLORS.riderBlue },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {MENU.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuRow}
            onPress={() => item.route && navigation.navigate(item.route)}
          >
            <Ionicons name={item.icon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        <RiderPrimaryButton
          title="Cerrar sesión"
          variant="outline"
          onPress={() => Alert.alert('Cerrar sesión', '¿Seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: logout },
          ])}
          style={styles.logout}
          textStyle={{ color: COLORS.riderRed }}
        />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md, marginBottom: SIZES.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.riderCard,
    borderWidth: 2,
    borderColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.subtitle },
  name: { color: COLORS.text, fontSize: SIZES.h3, fontWeight: '700' },
  role: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 2 },
  docCard: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.md },
  docTitle: { flex: 1, color: COLORS.textMuted, fontSize: SIZES.caption, fontWeight: '700', letterSpacing: 1 },
  vigente: { backgroundColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: SIZES.radiusFull },
  vigenteText: { color: COLORS.riderBlue, fontSize: 10, fontWeight: '700' },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  docLabel: { color: COLORS.textMuted },
  docValue: { color: COLORS.riderBlue, fontWeight: '700' },
  docValueWhite: { color: COLORS.text, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.lg },
  stat: {
    flex: 1,
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: SIZES.h2, fontWeight: '700' },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 4 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    backgroundColor: COLORS.riderCard,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.sm,
  },
  menuLabel: { flex: 1, color: COLORS.text, fontWeight: '500' },
  logout: { marginTop: SIZES.lg, borderColor: COLORS.riderRed },
});

export default RiderProfileScreen;
