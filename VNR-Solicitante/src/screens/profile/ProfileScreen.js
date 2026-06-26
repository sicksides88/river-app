import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { auxilioService, membershipService } from '../../services';
import { navigateMainTab } from '../../navigation/rootNavigation';
import { COLORS, SIZES } from '../../constants/theme';
import { getPlanDisplayName, resolveCurrentPlanId } from '../../utils/subscriptionPlans';

const PLAN_HOURS_LIMIT = 12;

const LINK_TYPE_LABELS = {
  aseguradora: 'Vía aseguradora',
  independiente: 'Asociación independiente',
};

const getUserInitials = (user) => {
  const first = user?.nombre?.trim?.() || '';
  const last = user?.apellido?.trim?.() || '';
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  const email = user?.email?.trim?.() || '';
  if (email) return email.slice(0, 2).toUpperCase();
  return 'NA';
};

const getDisplayName = (user) => {
  const full = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
  return full || user?.email || 'Usuario';
};

const parsePolicyExpiry = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parts = trimmed.split(/[/-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => parseInt(p, 10));
    if (d && m && y) return new Date(y, m - 1, d);
  }
  return null;
};

const isActiveMember = (user, membership) => {
  const skipped = membership?.membership_skipped ?? user?.membership_skipped;
  if (skipped) return false;

  const onboarded = membership?.onboarding_completed ?? user?.onboarding_completed;
  if (!onboarded) return false;

  const linkType = membership?.link_type || user?.link_type || 'independiente';
  if (linkType !== 'aseguradora') return true;

  const expiry = parsePolicyExpiry(membership?.policy_expiry_date);
  if (!expiry) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry >= today;
};

const computeMemberDays = (user, membership, auxilios) => {
  const createdRaw = user?.created_at || user?.createdAt;
  if (createdRaw) {
    const created = new Date(createdRaw);
    if (!Number.isNaN(created.getTime())) {
      return Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
    }
  }

  const dates = (auxilios || [])
    .map((a) => a.createdAt || a.created_at)
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (dates.length === 0) return 0;
  const earliest = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
  return Math.max(0, Math.floor((Date.now() - earliest.getTime()) / 86400000));
};

const computeHoursConsumed = (auxilios) => {
  const completed = (auxilios || []).filter((a) => {
    const status = (a.status || '').toLowerCase();
    return status === 'finalizado' || status === 'completed';
  });

  const totalMinutes = completed.reduce((sum, a) => sum + (Number(a.durationMinutes) || 0), 0);
  return Math.min(PLAN_HOURS_LIMIT, Math.round(totalMinutes / 60));
};

const computePlanLabel = (user, membership) =>
  getPlanDisplayName(resolveCurrentPlanId(user, membership));

const ProfileMenuRow = ({ icon, iconFamily = 'ionicons', title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.menuIconBox}>
      {iconFamily === 'material' ? (
        <MaterialCommunityIcons name={icon} size={18} color={COLORS.info} />
      ) : (
        <Ionicons name={icon} size={18} color={COLORS.info} />
      )}
    </View>
    <View style={styles.menuTextCol}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const StatCard = ({ value, valueAccent, label }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, valueAccent && styles.statValueAccent]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [stats, setStats] = useState({
    hoursConsumed: 0,
    planLabel: 'Básico',
    memberDays: 0,
  });

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [membershipRes, auxRes] = await Promise.all([
        membershipService.getMembership().catch(() => null),
        auxilioService.getUserAuxilios().catch(() => ({ auxilios: [] })),
      ]);

      const membershipData = membershipRes?.membership || null;
      const auxilios = auxRes?.auxilios || [];

      setMembership(membershipData);
      setStats({
        hoursConsumed: computeHoursConsumed(auxilios),
        planLabel: computePlanLabel(user, membershipData),
        memberDays: computeMemberDays(user, membershipData, auxilios),
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const linkType = membership?.link_type || user?.link_type || 'independiente';
  const linkSubtitle = LINK_TYPE_LABELS[linkType] || LINK_TYPE_LABELS.independiente;
  const memberActive = isActiveMember(user, membership);
  const hoursLabel = `${stats.hoursConsumed} / ${PLAN_HOURS_LIMIT}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Perfil</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{getUserInitials(user)}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getDisplayName(user)}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email || '—'}
            </Text>
            {memberActive ? (
              <View style={styles.memberBadge}>
                <View style={styles.memberDot} />
                <Text style={styles.memberBadgeText}>SOCIO ACTIVO</Text>
              </View>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={COLORS.info} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatCard value={hoursLabel} label="hs consumidas" />
            <StatCard value={stats.planLabel} valueAccent label="plan" />
            <StatCard value={String(stats.memberDays)} label="días socio" />
          </View>
        )}

        <View style={styles.menuSection}>
          <ProfileMenuRow
            icon="card-outline"
            title="Suscripción y Pagos"
            onPress={() => navigation.navigate('Suscripcion')}
          />
          <ProfileMenuRow
            icon="link-outline"
            title="Tipo de vínculo"
            subtitle={linkSubtitle}
            onPress={() => navigation.navigate('TipoVinculo')}
          />
          <ProfileMenuRow
            icon="shield-outline"
            title="Compañía Aseguradora"
            onPress={() => navigation.navigate('Aseguradora')}
          />
          <ProfileMenuRow
            icon="help-circle-outline"
            title="Historial de servicios"
            onPress={() => navigateMainTab(navigation, 'ActivityTab', { screen: 'ActivityMain' })}
          />
          <ProfileMenuRow
            icon="notifications-outline"
            title="Notificaciones"
            onPress={() => navigation.navigate('Notifications')}
          />
          <ProfileMenuRow
            icon="lifebuoy"
            iconFamily="material"
            title="Ayuda y soporte"
            onPress={() => navigation.navigate('Ayuda')}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  screenTitle: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.info,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  avatarInitials: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.info,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.info,
  },
  memberBadgeText: {
    fontSize: SIZES.caption,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  statsLoading: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  statValue: {
    fontSize: SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statValueAccent: {
    color: COLORS.info,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    gap: 6,
    marginBottom: SIZES.lg,
    paddingHorizontal: SIZES.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingVertical: 10,
    paddingHorizontal: SIZES.sm,
    minHeight: 44,
  },
  menuIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  menuSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    lineHeight: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    marginHorizontal: SIZES.sm,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  logoutText: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.error,
  },
});

export default ProfileScreen;
