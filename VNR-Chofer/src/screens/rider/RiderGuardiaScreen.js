import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { driverService, auxilioService, patrolService, ratingService } from '../../services';
import { driverPresence } from '../../services/driverPresence.service';
import { useAuth } from '../../context/AuthContext';
import { useDriverSocket } from '../../hooks/useSocket';
import { useSocketContext } from '../../context/SocketContext';
import RiderGuardiaToggle from '../../components/rider/RiderGuardiaToggle';
import AuxilioRequestModal from './AuxilioRequestModal';
import { COLORS, SIZES } from '../../constants/theme';
import {
  getRiderDisplayName,
  getRiderInitials,
  formatShiftRange,
  countAuxiliosToday,
  estimateHoursToday,
} from '../../utils/riderDisplay';
import { pickActiveDriverAuxilio } from '../../utils/riderActiveAuxilio';
import { pickActiveAuxilioBoat, getBoatDisplayName } from '../../utils/riderBoat';
import { isSimulationAuxilio, createDemoAuxilio } from '../../constants/demoAuxilio';
import { RiderPrimaryButton } from '../../components/rider';
import { scheduleService } from '../../services';
import {
  canActivateGuard,
  getGuardBlockReason,
  getActiveGuardWindowLabel,
  isInGuardAvailabilityWindow,
} from '../../utils/riderAvailability';

const mapRequestToAuxilio = (data) => {
  if (data.auxilio) return data.auxilio;
  let meta = {};
  try {
    meta = data.notes ? JSON.parse(data.notes) : {};
  } catch {
    meta = {};
  }
  return {
    id: data.rideId || data.auxilioId || data.id,
    emergencyType: meta.emergencyType || data.emergencyType,
    vessel: meta.vessel || (meta.vesselName ? { id: meta.vesselId, name: meta.vesselName } : null),
    vesselName: meta.vessel?.name || meta.vesselName || data.vesselName,
    vesselId: meta.vessel?.id || meta.vesselId,
    failureTypes: meta.failureTypes || data.failureTypes || [],
    pickup: {
      address: data.pickup?.address,
      coordinates: {
        lat: data.pickup?.lat ?? data.pickup?.coordinates?.lat,
        lng: data.pickup?.lng ?? data.pickup?.coordinates?.lng,
      },
    },
  };
};

const RiderGuardiaScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, isConnected: socketConnected } = useSocketContext();
  const [enGuardia, setEnGuardia] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [driverStatus, setDriverStatus] = useState(null);
  const [activeAuxilio, setActiveAuxilio] = useState(null);
  const [pendingAuxilio, setPendingAuxilio] = useState(null);
  const [showAuxilioModal, setShowAuxilioModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [hasShift, setHasShift] = useState(false);
  const [shift, setShift] = useState(null);
  const [availabilitySchedule, setAvailabilitySchedule] = useState(null);
  const [canGoOnGuard, setCanGoOnGuard] = useState(false);
  const [unitLabel, setUnitLabel] = useState('—');
  const [stats, setStats] = useState({ auxiliosHoy: 0, horas: '0 h', rating: '—' });
  const locationSubscription = useRef(null);
  const [coords, setCoords] = useState({ latitude: -34.6037, longitude: -58.3816 });

  const displayName = getRiderDisplayName(user);
  const initials = getRiderInitials(user);
  const baseName = shift?.base?.name ? shift.base.name.toUpperCase() : 'SIN BASE ASIGNADA';
  const baseLocation = shift?.base?.address || shift?.base?.name || 'Consultá tu turno en Agenda';
  const shiftRange = formatShiftRange(shift?.starts_at, shift?.ends_at);
  const availabilityWindow = getActiveGuardWindowLabel(availabilitySchedule);
  const inAvailabilityWindow = isInGuardAvailabilityWindow(availabilitySchedule);
  const turnoDisplay = hasShift ? shiftRange : availabilityWindow || '—';
  const guardiaStatusLabel =
    enGuardia || canGoOnGuard
      ? inAvailabilityWindow || hasShift
        ? 'EN GUARDIA · DISPONIBLE'
        : 'EN GUARDIA'
      : 'SIN TURNO';

  const handleNewAuxilio = useCallback((data) => {
    if (!enGuardia) return;
    const auxilio = mapRequestToAuxilio(data);
    if (AppState.currentState !== 'active') {
      driverPresence.notifyNewOrder({
        title: 'Nuevo auxilio náutico',
        body: auxilio.vesselName || 'Solicitud de auxilio',
        data: { type: 'rider_new_auxilio', auxilioId: auxilio.id },
      });
    }
    setPendingAuxilio(auxilio);
    setShowAuxilioModal(true);
  }, [enGuardia]);

  const loadActiveAuxilio = useCallback(async () => {
    try {
      const auxRes = await auxilioService.getUserAuxilios({ role: 'driver' });
      const auxilios = auxRes.auxilios || [];
      setActiveAuxilio(pickActiveDriverAuxilio(auxilios));
      return auxilios;
    } catch {
      setActiveAuxilio(null);
      return [];
    }
  }, []);

  const { goOnline, goOffline } = useDriverSocket({
    onNewRideRequest: (data) => {
      if (data.serviceType === 'auxilio' || data.type === 'auxilio') {
        handleNewAuxilio(data);
      }
    },
    onTripCancelled: () => {
      Alert.alert('Auxilio cancelado', 'El solicitante canceló el auxilio.');
      setActiveAuxilio(null);
      setPendingAuxilio(null);
      setShowAuxilioModal(false);
    },
  });

  useEffect(() => {
    if (!socket || !socketConnected) return;
    const handler = (data) => handleNewAuxilio(data);
    socket.on('auxilio:new_request', handler);
    return () => socket.off('auxilio:new_request', handler);
  }, [socket, socketConnected, handleNewAuxilio]);

  useEffect(() => {
    if (!socket) return;
    const refreshActive = () => { loadActiveAuxilio(); };
    socket.on('auxilio:status_changed', refreshActive);
    socket.on('ride:cancelled', refreshActive);
    socket.on('ride:status_changed', refreshActive);
    return () => {
      socket.off('auxilio:status_changed', refreshActive);
      socket.off('ride:cancelled', refreshActive);
      socket.off('ride:status_changed', refreshActive);
    };
  }, [socket, loadActiveAuxilio]);

  useEffect(() => {
    initializeLocation();
    driverPresence.load().then((presence) => {
      if (presence?.isActive && presence?.serviceType === 'auxilio') {
        setEnGuardia(true);
        driverPresence.startBackgroundUpdates();
      }
    });
    return () => {
      locationSubscription.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (socketConnected && enGuardia) {
      goOnline({
        latitude: coords.latitude,
        longitude: coords.longitude,
        serviceType: 'auxilio',
      });
    }
  }, [socketConnected, enGuardia, coords.latitude, coords.longitude]);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const statusRes = await driverService.getDriverStatus().catch(() => null);
      if (statusRes?.success) setDriverStatus(statusRes.status);

      const auxilios = await loadActiveAuxilio();

      const shiftRes = await patrolService.getMyShift().catch(() => ({ hasShift: false, shift: null }));
      const patrolShift = !!shiftRes?.hasShift;
      setHasShift(patrolShift);
      setShift(shiftRes?.shift || null);

      const scheduleRes = await scheduleService.getSchedule().catch(() => null);
      const schedule = scheduleRes?.schedule || null;
      setAvailabilitySchedule(schedule);
      const guardOk = canActivateGuard(schedule, patrolShift);
      setCanGoOnGuard(guardOk);

      const vehiclesRes = await driverService.getVehicles().catch(() => ({ vehicles: [] }));
      const vehicle = pickActiveAuxilioBoat(vehiclesRes?.vehicles || []);
      const plate = vehicle?.plate_number || vehicle?.plate || vehicle?.license_plate || vehicle?.matricula || vehicle?.registration;
      setUnitLabel(plate || getBoatDisplayName(vehicle) || '—');

      const ratingRes = await ratingService.getMyStats().catch(() => null);
      const rating = ratingRes?.stats?.averageRating ?? ratingRes?.averageRating ?? user?.rating;

      setStats({
        auxiliosHoy: countAuxiliosToday(auxilios),
        horas: estimateHoursToday(auxilios, shiftRes?.shift),
        rating: rating ? Number(rating).toFixed(1) : '—',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const startLocationTracking = async () => {
    if (!locationPermission) return;
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
      async (location) => {
        const { latitude, longitude } = location.coords;
        setCoords({ latitude, longitude });
        if (enGuardia) {
          driverService.updateAvailability(true, latitude, longitude, null, 'auxilio').catch(() => {});
        }
      }
    );
  };

  const stopLocationTracking = () => {
    locationSubscription.current?.remove?.();
    locationSubscription.current = null;
  };

  const toggleGuardia = async (value) => {
    if (!socketConnected && value) {
      navigation.navigate('Offline');
      return;
    }
    if (!canGoOnGuard && value) {
      const reason = getGuardBlockReason(availabilitySchedule, hasShift) || 'outside_window';
      navigation.navigate('SinTurno', { reason });
      return;
    }
    if (driverStatus && driverStatus !== 'active') {
      Alert.alert('Cuenta no activa', 'Tu cuenta de patrón aún no está habilitada.');
      return;
    }

    setIsLoading(true);
    try {
      if (value) {
        await driverService.updateAvailability(true, coords.latitude, coords.longitude, null, 'auxilio');
        goOnline({ latitude: coords.latitude, longitude: coords.longitude, serviceType: 'auxilio' });
        driverPresence.start({ serviceType: 'auxilio' });
        startLocationTracking();
        setEnGuardia(true);
      } else {
        await driverService.updateAvailability(false, coords.latitude, coords.longitude);
        goOffline();
        driverPresence.stop();
        stopLocationTracking();
        setEnGuardia(false);
        setShowAuxilioModal(false);
        setPendingAuxilio(null);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo cambiar el estado de guardia.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToServicioTab = (screen, params) => {
    navigation.getParent()?.navigate('RiderServicioTab', { screen, params });
  };

  const handleModalAccept = () => {
    setShowAuxilioModal(false);
    navigation.navigate('AcceptAuxilio', {
      auxilio: pendingAuxilio,
      simulation: !!pendingAuxilio?.simulation,
    });
  };

  const handleModalReject = () => {
    setShowAuxilioModal(false);
    navigation.navigate('RejectAuxilio', {
      auxilio: pendingAuxilio,
      simulation: !!pendingAuxilio?.simulation,
    });
  };

  const simulateNewAuxilio = () => {
    const demo = createDemoAuxilio(coords);
    setPendingAuxilio(demo);
    setShowAuxilioModal(true);
  };

  const handleActiveAuxilioPress = () => {
    if (!activeAuxilio) return;
    goToServicioTab('ServicioActivo', {
      auxilioId: activeAuxilio.id,
      auxilio: activeAuxilio,
      simulation: isSimulationAuxilio(activeAuxilio),
    });
  };

  const handleAbandonActiveAuxilio = () => {
    if (!activeAuxilio || isSimulationAuxilio(activeAuxilio)) {
      setActiveAuxilio(null);
      return;
    }
    Alert.alert(
      'Abandonar auxilio',
      '¿Querés salir de este auxilio? El servicio volverá a quedar disponible para otro patrón.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            try {
              await auxilioService.abandonAuxilio(activeAuxilio.id);
              setActiveAuxilio(null);
              Alert.alert('Listo', 'Ya no tenés auxilios en curso.');
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'No se pudo abandonar el auxilio.');
            }
          },
        },
      ]
    );
  };

  if (loadingData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.riderBlue} />
      </View>
    );
  }

  if (driverStatus && driverStatus !== 'active') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.pendingContainer}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.warning} />
          <Text style={styles.pendingTitle}>Cuenta en revisión</Text>
          <Text style={styles.pendingSubtitle}>
            Tu perfil de patrón está siendo verificado. Te avisaremos cuando puedas activar EN GUARDIA.
          </Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.refreshText}>Verificar estado</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.roleLabel}>
              PATRÓN · {guardiaStatusLabel}
            </Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.getParent()?.navigate('RiderProfileTab')}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {!socketConnected && (
          <TouchableOpacity style={styles.offlineBanner} onPress={() => navigation.navigate('Offline')}>
            <Ionicons name="cloud-offline-outline" size={18} color={COLORS.riderOrange} />
            <Text style={styles.offlineText}>Sin conexión · tocá para reintentar</Text>
          </TouchableOpacity>
        )}

        {/* Toggle EN GUARDIA */}
        <RiderGuardiaToggle active={enGuardia} onToggle={toggleGuardia} loading={isLoading} />

        {/* Auxilio en curso */}
        {activeAuxilio && (
          <View style={styles.activeBannerWrap}>
            <TouchableOpacity style={styles.activeBanner} onPress={handleActiveAuxilioPress} activeOpacity={0.9}>
              <Ionicons name="boat" size={22} color={COLORS.white} />
              <View style={styles.activeInfo}>
                <Text style={styles.activeTitle}>Auxilio en curso</Text>
                <Text style={styles.activeMeta} numberOfLines={1}>
                  {activeAuxilio.vesselName || activeAuxilio.pickup?.address}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.activeDismiss} onPress={handleAbandonActiveAuxilio}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Base */}
        <View style={styles.baseCard}>
          <View style={styles.baseIcon}>
            <Ionicons name="location" size={22} color={COLORS.riderBlue} />
          </View>
          <View style={styles.baseInfo}>
            <Text style={styles.cardLabel}>{baseName}</Text>
            <Text style={styles.cardValue}>{baseLocation}</Text>
          </View>
        </View>

        {/* Turno + Unidad */}
        <View style={styles.row2}>
          <View style={[styles.infoCard, styles.infoCardHalf]}>
            <Text style={styles.cardLabel}>TURNO</Text>
            <Text style={styles.cardValue}>{turnoDisplay}</Text>
          </View>
          <View style={[styles.infoCard, styles.infoCardHalf]}>
            <Text style={styles.cardLabel}>UNIDAD</Text>
            <Text style={[styles.cardValue, styles.unitValue]}>{unitLabel}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.auxiliosHoy}</Text>
            <Text style={styles.statLabel}>auxilios hoy</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.horas}</Text>
            <Text style={styles.statLabel}>navegadas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.ratingValue]}>{stats.rating}</Text>
            <Text style={styles.statLabel}>calificación</Text>
          </View>
        </View>

        {/* Simulación UI — recorrer flujo completo sin backend */}
        <View style={styles.simSection}>
          <Text style={styles.simLabel}>MODO PRUEBA</Text>
          <RiderPrimaryButton
            title="Simular nuevo auxilio"
            variant="outline"
            onPress={simulateNewAuxilio}
            style={styles.simBtn}
          />
          <Text style={styles.simHint}>
            Abrí el modal de auxilio con datos demo y recorré todas las pantallas manualmente. No requiere EN GUARDIA.
          </Text>
        </View>
      </ScrollView>

      <AuxilioRequestModal
        visible={showAuxilioModal}
        auxilio={pendingAuxilio}
        onAccept={handleModalAccept}
        onReject={handleModalReject}
        onClose={() => setShowAuxilioModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.riderNavy },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  headerText: { flex: 1 },
  roleLabel: {
    color: COLORS.riderBlue,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  userName: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.riderCard,
    borderWidth: 2,
    borderColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.md,
  },
  avatarText: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.subtitle },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.riderOrangeMuted,
    padding: SIZES.sm,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.md,
  },
  offlineText: { color: COLORS.riderOrange, fontSize: SIZES.caption, fontWeight: '600' },
  activeBannerWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SIZES.xs,
    marginBottom: SIZES.md,
  },
  activeBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.riderBlue,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  activeDismiss: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeInfo: { flex: 1 },
  activeTitle: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.body },
  activeMeta: { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.small, marginTop: 2 },
  baseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    gap: SIZES.md,
  },
  baseIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.riderCardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseInfo: { flex: 1 },
  cardLabel: {
    color: COLORS.riderBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardValue: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '700' },
  unitValue: { color: COLORS.riderBlue },
  row2: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.md },
  infoCard: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCardHalf: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: SIZES.sm },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.riderBlue, fontSize: SIZES.h2, fontWeight: '700' },
  ratingValue: { color: COLORS.riderOrange },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 4, textAlign: 'center' },
  pendingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  pendingTitle: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', marginTop: SIZES.lg, textAlign: 'center' },
  pendingSubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm, lineHeight: 22 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SIZES.xl },
  refreshText: { color: COLORS.textSecondary },
  simSection: {
    marginTop: SIZES.lg,
    padding: SIZES.md,
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.riderBlue,
    borderStyle: 'dashed',
  },
  simLabel: {
    color: COLORS.riderBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.sm,
  },
  simBtn: { marginBottom: SIZES.sm },
  simHint: { color: COLORS.textMuted, fontSize: SIZES.caption, lineHeight: 18, textAlign: 'center' },
});

export default RiderGuardiaScreen;
