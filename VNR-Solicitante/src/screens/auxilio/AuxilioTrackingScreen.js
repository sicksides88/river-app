import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { auxilioService } from '../../services';
import { useSocketContext } from '../../context/SocketContext';
import { useDriverLocation, useAuxilioSimulator } from '../../hooks';
import {
  isAuxilioAssignmentFailure,
  resolveAuxilioRejectionReason,
} from '../../utils/auxilioRejection';
import {
  AuxilioLiveHeader,
  AuxilioLiveMap,
  AuxilioLiveSheet,
  AuxilioSimulateButton,
} from '../../components/riverservice/auxilio-live';
import { COLORS, SIZES } from '../../constants/theme';

const AuxilioTrackingScreen = ({ navigation, route }) => {
  const { auxilioId, auxilio: initial } = route.params || {};
  const { socket, isConnected } = useSocketContext();
  const [auxilio, setAuxilio] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [cancelLoading, setCancelLoading] = useState(false);
  const isSimulatingRef = useRef(false);
  const rejectionNavRef = useRef(false);

  const {
    isSimulating,
    stepLabel,
    simulatedAuxilio,
    mockDriverLocation,
    startSimulation,
    stopSimulation,
  } = useAuxilioSimulator();

  isSimulatingRef.current = isSimulating;

  const fetchAuxilio = useCallback(async () => {
    if (!auxilioId || isSimulatingRef.current) return;
    try {
      const res = await auxilioService.getAuxilioById(auxilioId);
      if (res.auxilio) {
        setAuxilio((prev) => {
          const next = res.auxilio;
          const prevLat = prev?.pickup?.coordinates?.lat;
          const prevLng = prev?.pickup?.coordinates?.lng;
          const nextLat = next?.pickup?.coordinates?.lat;
          const nextLng = next?.pickup?.coordinates?.lng;
          const nextValid =
            nextLat != null &&
            nextLng != null &&
            Number.isFinite(Number(nextLat)) &&
            Number.isFinite(Number(nextLng));
          const prevValid =
            prevLat != null &&
            prevLng != null &&
            Number.isFinite(Number(prevLat)) &&
            Number.isFinite(Number(prevLng));

          if (!nextValid && prevValid) {
            return {
              ...next,
              pickup: {
                ...next.pickup,
                address: prev.pickup?.address || next.pickup?.address,
                coordinates: { lat: prevLat, lng: prevLng },
              },
            };
          }
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [auxilioId]);

  useFocusEffect(useCallback(() => {
    if (!isSimulatingRef.current) fetchAuxilio();
  }, [fetchAuxilio]));

  useEffect(() => {
    if (!socket || !isConnected || !auxilioId) return;

    const handler = (data) => {
      if (isSimulatingRef.current) return;
      if (data.rideId === auxilioId || data.auxilioId === auxilioId) {
        fetchAuxilio();
      }
    };

    const etaHandler = (data) => {
      if (isSimulatingRef.current) return;
      if (data.rideId !== auxilioId && data.auxilioId !== auxilioId) return;
      const eta = data.etaMinutes ?? data.eta;
      if (eta != null) {
        setAuxilio((prev) => (prev ? { ...prev, etaMinutes: eta } : prev));
      }
    };

    socket.on('ride:status_changed', handler);
    socket.on('auxilio:status_changed', handler);
    socket.on('ride:accepted', handler);
    socket.on('ride:eta_changed', etaHandler);
    socket.on('auxilio:eta_changed', etaHandler);

    return () => {
      socket.off('ride:status_changed', handler);
      socket.off('auxilio:status_changed', handler);
      socket.off('ride:accepted', handler);
      socket.off('ride:eta_changed', etaHandler);
      socket.off('auxilio:eta_changed', etaHandler);
    };
  }, [socket, isConnected, auxilioId, fetchAuxilio]);

  const displayAuxilio = isSimulating && simulatedAuxilio ? simulatedAuxilio : auxilio;

  const pickupCoords = useMemo(() => {
    const lat = displayAuxilio?.pickup?.coordinates?.lat;
    const lng = displayAuxilio?.pickup?.coordinates?.lng;
    if (lat == null || lng == null) return null;
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return { latitude: la, longitude: ln };
  }, [displayAuxilio?.pickup?.coordinates?.lat, displayAuxilio?.pickup?.coordinates?.lng]);

  const driverId = !isSimulating ? displayAuxilio?.driver?.id : null;
  const { driverLocation, eta: driverEta } = useDriverLocation(
    driverId,
    auxilioId,
    pickupCoords
  );

  const mapDriverLocation = isSimulating ? mockDriverLocation : driverLocation;

  const etaMinutes = useMemo(() => {
    if (displayAuxilio?.etaMinutes) return displayAuxilio.etaMinutes;
    if (isSimulating) return null;
    const secs = driverEta?.duration?.value;
    if (secs) return Math.max(1, Math.round(secs / 60));
    return null;
  }, [displayAuxilio?.etaMinutes, driverEta, isSimulating]);

  const auxilioWithEta = useMemo(
    () => (displayAuxilio ? { ...displayAuxilio, etaMinutes } : displayAuxilio),
    [displayAuxilio, etaMinutes]
  );

  const goHome = useCallback(() => {
    stopSimulation();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  }, [navigation, stopSimulation]);

  useEffect(() => () => stopSimulation(), [stopSimulation]);

  useEffect(() => {
    if (isSimulating || rejectionNavRef.current || !displayAuxilio) return;
    if (!isAuxilioAssignmentFailure(displayAuxilio)) return;

    rejectionNavRef.current = true;
    navigation.replace('AuxilioRechazado', {
      auxilioId: displayAuxilio.id,
      auxilio: displayAuxilio,
      reason: resolveAuxilioRejectionReason(displayAuxilio),
    });
  }, [displayAuxilio, isSimulating, navigation]);

  const handleBack = () => {
    if (['finalizado', 'cancelado', 'rechazado'].includes(displayAuxilio?.status)) {
      goHome();
      return;
    }
    Alert.alert(
      'Salir del seguimiento',
      'Podés volver desde el inicio mientras el auxilio sigue activo.',
      [
        { text: 'Quedarme', style: 'cancel' },
        { text: 'Ir al inicio', onPress: goHome },
      ]
    );
  };

  const handleCancel = () => {
    if (isSimulating) return;

    if (!auxilioId) {
      Alert.alert('Error', 'No se encontró la solicitud activa.');
      return;
    }

    Alert.alert(
      'Cancelar solicitud',
      '¿Confirmás que querés cancelar el auxilio?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
            try {
              await auxilioService.cancelAuxilio(auxilioId);
              setAuxilio((prev) =>
                prev ? { ...prev, status: 'cancelado', rawStatus: 'cancelled' } : prev
              );
              Alert.alert(
                'Solicitud cancelada',
                'Podés pedir un nuevo auxilio cuando lo necesites.',
                [{ text: 'OK', onPress: goHome }]
              );
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.message ||
                'No se pudo cancelar la solicitud';
              Alert.alert('Error', message);
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    navigation.navigate('ReportarProblema', {
      auxilioId,
      auxilio: auxilioWithEta,
    });
  };

  const handleMessage = () => {
    navigation.navigate('Chat', {
      auxilioId,
      rideId: auxilioId,
      recipientId: displayAuxilio?.driver?.id,
      recipientName: displayAuxilio?.driver?.name,
    });
  };

  const handleRate = () => {
    navigation.navigate('RateAuxilio', {
      auxilioId,
      rideId: auxilioId,
      ratedId: displayAuxilio?.driver?.id,
      driver: displayAuxilio?.driver,
    });
  };

  const handleDetail = () => {
    Alert.alert(
      'Detalle del servicio',
      `Tipo: ${displayAuxilio?.emergencyType || '—'}\nPatrón: ${displayAuxilio?.driver?.name || '—'}\nDuración: ${displayAuxilio?.durationLabel || '—'}`,
      [{ text: 'OK' }]
    );
  };

  const handleStartSimulation = () => {
    if (auxilio) startSimulation(auxilio);
  };

  const handleStopSimulation = () => {
    stopSimulation();
    fetchAuxilio();
  };

  if (loading || !auxilio) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.info} />
        <Text style={styles.loadingText}>Estamos buscando tu patrón...</Text>
      </View>
    );
  }

  const isSearching = ['solicitado', 'buscando'].includes(auxilioWithEta?.status);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <AuxilioLiveMap
          style={styles.map}
          pickup={auxilioWithEta?.pickup}
          driverLocation={mapDriverLocation}
          searching={isSearching}
        />
      </View>
      <AuxilioLiveHeader
        auxilio={auxilioWithEta}
        onBack={handleBack}
        rightSlot={
          <AuxilioSimulateButton
            isSimulating={isSimulating}
            stepLabel={stepLabel}
            onStart={handleStartSimulation}
            onStop={handleStopSimulation}
          />
        }
      />
      <View style={styles.sheetWrap}>
        <AuxilioLiveSheet
          auxilio={auxilioWithEta}
          onCancel={handleCancel}
          onReport={handleReport}
          onMessage={handleMessage}
          onRate={handleRate}
          onDetail={handleDetail}
          onGoHome={goHome}
          cancelLoading={cancelLoading}
          simulating={isSimulating}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  mapWrap: { flex: 0.45, overflow: 'hidden' },
  map: { flex: 1 },
  sheetWrap: { flex: 1, minHeight: 0 },
  loadingText: { color: COLORS.textSecondary, marginTop: SIZES.md },
});

export default AuxilioTrackingScreen;
