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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import { SOSButton, GlassCard, VesselPickerModal } from '../../components/riverservice';
import { auxilioService, vesselService, membershipService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { isActiveAuxilioStatus } from '../../utils/auxilioLive';
import { formatVesselSubtitle } from '../../utils/vesselForm';
import { navigateRoot } from '../../navigation/rootNavigation';

const DEFAULT_LOCATION = 'Río Paraná · Rosario';

const WEATHER = {
  wind: {
    label: 'Viento',
    value: 'SE 15 km/h',
    detail: 'Ráfagas 25 · máx 18 / mín 12 km/h',
    icon: 'weather-windy',
  },
  tide: {
    label: 'Marea',
    value: 'Creciendo · 1.2 m',
    detail: 'Pleamar 16:40 · 1.8 m · Bajamar 23:10 · 0.4 m',
    icon: 'waves',
  },
};

const getUserInitials = (user) => {
  const first = user?.nombre?.trim?.() || '';
  const last = user?.apellido?.trim?.() || '';
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (user?.name) return user.name.slice(0, 2).toUpperCase();
  return 'NA';
};

const formatVesselMeta = (vessel) => {
  if (!vessel) return 'Agregá tu embarcación para pedir auxilio';
  return formatVesselSubtitle(vessel);
};

const RiverHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocketContext();
  const [vessels, setVessels] = useState([]);
  const [activeVessel, setActiveVessel] = useState(null);
  const [activeAuxilio, setActiveAuxilio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline] = useState(true);
  const [linkType, setLinkType] = useState('independiente');
  const [membership, setMembership] = useState(null);
  const [showVesselModal, setShowVesselModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, membershipRes] = await Promise.all([
        vesselService.getVessels(),
        membershipService.getMembership().catch(() => null),
      ]);
      setVessels(vRes.vessels || []);
      setMembership(membershipRes?.membership || null);
      setLinkType(
        membershipRes?.membership?.link_type || user?.link_type || 'independiente'
      );
      const activeId = await vesselService.getActiveVesselId();
      const active = (vRes.vessels || []).find((v) => v.id === activeId) || vRes.vessels?.[0];
      setActiveVessel(active || null);
      if (active && !activeId) await vesselService.setActiveVesselId(active.id);

      const auxRes = await auxilioService.getUserAuxilios({ status: 'active' });
      const activeList = (auxRes.auxilios || []).filter((a) => isActiveAuxilioStatus(a.status));
      setActiveAuxilio(activeList[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.link_type]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = () => loadData();
    socket.on('ride:status_changed', handler);
    socket.on('auxilio:status_changed', handler);
    return () => {
      socket.off('ride:status_changed', handler);
      socket.off('auxilio:status_changed', handler);
    };
  }, [socket, isConnected, loadData]);

  const handleSOS = async () => {
    try {
      if (!isOnline) {
        navigateRoot(navigation, 'SinConexion');
        return;
      }

      const vesselForAuxilio = await vesselService.resolveActiveVessel(vessels);
      if (!vesselForAuxilio) {
        navigateRoot(navigation, 'NoEmbarcacion');
        return;
      }

      if (linkType === 'aseguradora' && !user?.is_member) {
        navigateRoot(navigation, 'NoSocio');
        return;
      }
      if (activeAuxilio) {
        navigateRoot(navigation, 'AuxilioTracking', {
          auxilioId: activeAuxilio.id,
          auxilio: activeAuxilio,
        });
        return;
      }
      navigateRoot(navigation, 'SOSWizard', { vessel: vesselForAuxilio });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo iniciar el pedido de auxilio. Intentá de nuevo.');
    }
  };

  const selectVessel = async (v) => {
    setActiveVessel(v);
    await vesselService.setActiveVesselId(v.id);
    setShowVesselModal(false);
  };

  const openVessel = () => {
    setShowVesselModal(true);
  };

  const handleAddVessel = () => {
    setShowVesselModal(false);
    navigation.getParent()?.navigate('FleetTab', { screen: 'AddVessel' });
  };

  const openSubscription = () => {
    navigation.getParent()?.navigate('ProfileTab', { screen: 'Suscripcion' });
  };

  const locationLabel =
    activeVessel?.geographic_area || user?.direccion || DEFAULT_LOCATION;

  const subscriptionTitle =
    linkType === 'aseguradora' && membership?.insurance_company
      ? `${membership.insurance_company} · Activa`
      : 'Premium · Activa';

  const subscriptionDetail =
    membership?.policy_expiry_date
      ? `Vence el ${membership.policy_expiry_date.replace(/\s/g, '')}`
      : 'Vence el 20/06/2026';

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryAccent} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0B1220', '#0F172A', '#0B1220']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.locationCaption}>UBICACIÓN</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={COLORS.info} />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {!isOnline && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigateRoot(navigation, 'SinConexion')}
              >
                <Ionicons name="cloud-offline-outline" size={20} color={COLORS.warning} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.getParent()?.navigate('ProfileTab')}
            >
              <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity activeOpacity={0.85} onPress={openVessel}>
            <GlassCard style={styles.vesselBanner}>
              <View style={styles.vesselIconBox}>
                <Ionicons name="boat" size={26} color={COLORS.text} />
              </View>
              <View style={styles.vesselInfo}>
                <Text style={styles.vesselName} numberOfLines={1}>
                  {activeVessel?.name || 'Sin embarcación'}
                </Text>
                <Text style={styles.vesselMeta} numberOfLines={1}>
                  {formatVesselMeta(activeVessel)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textMuted}
              />
            </GlassCard>
          </TouchableOpacity>

          {activeAuxilio && (
            <TouchableOpacity
              onPress={() =>
                navigateRoot(navigation, 'AuxilioTracking', {
                  auxilioId: activeAuxilio.id,
                  auxilio: activeAuxilio,
                })
              }
            >
              <GlassCard style={styles.activeBanner}>
                <Ionicons name="radio-outline" size={20} color={COLORS.primaryAccent} />
                <Text style={styles.activeText}>
                  Auxilio en curso · {activeAuxilio.status}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </GlassCard>
            </TouchableOpacity>
          )}

          <View style={styles.sosSection}>
            <Text style={styles.sosTitle}>¿Necesitás asistencia?</Text>
            <Text style={styles.sosSubtitle}>
              Presioná en caso de emergencia náutica
            </Text>
            <SOSButton
              onPress={handleSOS}
              disabled={!activeVessel && vessels.length === 0}
            />
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={openSubscription}>
            <GlassCard style={styles.subscriptionCard}>
              <View style={styles.subscriptionIconBox}>
                <Ionicons name="ribbon" size={22} color={COLORS.primaryAccent} />
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTitle}>{subscriptionTitle}</Text>
                <Text style={styles.subscriptionDetail}>{subscriptionDetail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </GlassCard>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            {[WEATHER.wind, WEATHER.tide].map((item) => (
              <GlassCard key={item.label} style={styles.weatherCard}>
                <View style={styles.weatherHeader}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={18}
                    color={COLORS.info}
                  />
                  <Text style={styles.weatherLabel}>{item.label}</Text>
                </View>
                <Text style={styles.weatherValue}>{item.value}</Text>
                <Text style={styles.weatherDetail}>{item.detail}</Text>
              </GlassCard>
            ))}
          </View>
        </ScrollView>
        </SafeAreaView>
      </View>

      <VesselPickerModal
        visible={showVesselModal}
        onClose={() => setShowVesselModal(false)}
        vessels={vessels}
        activeVesselId={activeVessel?.id}
        onSelect={selectVessel}
        onAddNew={handleAddVessel}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.md,
  },
  headerLeft: { flex: 1, paddingRight: SIZES.md },
  locationCaption: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '500',
    flexShrink: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  vesselBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  vesselIconBox: {
    width: 52,
    height: 52,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vesselInfo: { flex: 1 },
  vesselName: {
    color: COLORS.text,
    fontSize: SIZES.title,
    fontWeight: '700',
  },
  vesselMeta: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    marginTop: 4,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  activeText: { flex: 1, color: COLORS.primaryAccent, fontWeight: '600' },
  sosSection: {
    alignItems: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  sosTitle: {
    color: COLORS.text,
    fontSize: SIZES.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  sosSubtitle: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: 20,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  subscriptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  subscriptionInfo: { flex: 1 },
  subscriptionTitle: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  subscriptionDetail: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: SIZES.sm },
  weatherCard: { flex: 1, minHeight: 118 },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SIZES.sm,
  },
  weatherLabel: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    fontWeight: '500',
  },
  weatherValue: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
    marginBottom: 6,
  },
  weatherDetail: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
});

export default RiverHomeScreen;
