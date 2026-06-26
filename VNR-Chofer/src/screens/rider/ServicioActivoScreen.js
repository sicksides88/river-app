import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  RiderMapLayout,
  RiderBottomSheet,
  RiderPrimaryButton,
  RiderSectionLabel,
  RiderPhotoCaptureBox,
  RiderSafetyRejectLink,
  RiderRegresoCard,
} from '../../components/rider';
import { auxilioService, patrolService } from '../../services';
import { useDriverLocationSender } from '../../hooks/useDriverLocation';
import {
  buildDisplayId,
  resolveFlowStep,
  RIDER_FLOW_STEPS,
  getProcesoStartedAt,
  getAuxilioMeta,
} from '../../hooks/useRiderServiceFlow';
import { useRiderRouteMetrics } from '../../hooks/useRiderRouteMetrics';
import { COLORS, SIZES, SERVICE_REASON_OPTIONS } from '../../constants/theme';
import { extractPickupCoordinate } from '../../utils/mapCoordinates';
import { isSimulationAuxilio, advanceSimulationStatus } from '../../constants/demoAuxilio';
import EnRutaCard from './service/EnRutaCard';
import EnProcesoCard from './service/EnProcesoCard';

const ServicioActivoScreen = ({ navigation, route }) => {
  const { auxilioId, auxilio: initial, simulation: simulationParam } = route.params || {};
  const simulation = simulationParam || isSimulationAuxilio(initial);
  const [auxilio, setAuxilio] = useState(initial);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [serviceReason, setServiceReason] = useState('remolque');
  const [notes, setNotes] = useState('');
  const [returnBase, setReturnBase] = useState(null);

  const fetchAuxilio = useCallback(async () => {
    if (!auxilioId || simulation) return;
    try {
      const res = await auxilioService.getAuxilioById(auxilioId);
      if (res.auxilio) {
        setAuxilio(res.auxilio);
        const meta = getAuxilioMeta(res.auxilio);
        if (meta.photos) setPhotos((p) => ({ ...p, ...meta.photos }));
        if (meta.serviceReason) setServiceReason(meta.serviceReason);
      }
    } catch (e) {
      console.error(e);
    }
  }, [auxilioId, simulation]);

  useFocusEffect(useCallback(() => { fetchAuxilio(); }, [fetchAuxilio]));

  const step = useMemo(
    () => resolveFlowStep(auxilio, photos, auxilio?.signature),
    [auxilio, photos]
  );

  const isActive = auxilio?.status !== 'finalizado';
  useDriverLocationSender(simulation ? null : auxilioId, isActive && !simulation, 5000);

  const { distanceKm, routeCoordinates, loading: metricsLoading } = useRiderRouteMetrics(
    step === RIDER_FLOW_STEPS.EN_RUTA ? auxilio : null
  );

  const region = useMemo(() => {
    const coord = extractPickupCoordinate(auxilio?.pickup);
    return { ...coord, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  }, [auxilio?.pickup]);

  const pickupMarker = useMemo(
    () => extractPickupCoordinate(auxilio?.pickup, null),
    [auxilio?.pickup]
  );

  const displayId = buildDisplayId(auxilio);
  const procesoStartedAt = useMemo(() => getProcesoStartedAt(auxilio), [auxilio]);

  useEffect(() => {
    if (step === RIDER_FLOW_STEPS.FOTO_PRE) setSheet('foto_pre');
    else if (step === RIDER_FLOW_STEPS.FOTO_DURING) setSheet('foto_during');
    else if (step === RIDER_FLOW_STEPS.CIERRE) setSheet('cierre');
    else if (
      [RIDER_FLOW_STEPS.EN_RUTA, RIDER_FLOW_STEPS.EN_PROCESO, RIDER_FLOW_STEPS.REGRESO, RIDER_FLOW_STEPS.FIRMA].includes(step)
    ) {
      setSheet(null);
    }
  }, [step]);

  useEffect(() => {
    if (step !== RIDER_FLOW_STEPS.REGRESO) return;
    (async () => {
      const baseFromAuxilio = auxilio?.departureBase || getAuxilioMeta(auxilio).departureBase;
      if (baseFromAuxilio) {
        setReturnBase({ name: baseFromAuxilio });
        return;
      }
      const shiftRes = await patrolService.getMyShift().catch(() => null);
      setReturnBase(shiftRes?.shift?.base || { name: 'Base operativa' });
    })();
  }, [step, auxilio]);

  const updateStatus = async (status, extra = {}) => {
    setLoading(true);
    try {
      if (simulation) {
        setAuxilio((prev) =>
          advanceSimulationStatus(prev, status || prev?.status, {
            ...extra,
            signature: extra.signature ?? prev?.signature,
            returnCompleted: extra.returnCompleted ?? prev?.returnCompleted,
            departureBase: extra.departureBase ?? prev?.departureBase,
            serviceReason: extra.serviceReason ?? prev?.serviceReason,
            closureNotes: extra.closureNotes ?? prev?.closureNotes,
          })
        );
        if (extra.photos) {
          setPhotos((p) => ({ ...p, ...extra.photos }));
        }
        return true;
      }
      await auxilioService.updateAuxilioStatus(auxilioId, status, {
        ...extra,
        closureNotes: extra.closureNotes ?? extra.notes,
      });
      await fetchAuxilio();
      return true;
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo actualizar.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (phase) => {
    if (simulation) {
      setPhotos((p) => ({ ...p, [phase]: `sim://${phase}` }));
      setAuxilio((prev) => ({
        ...prev,
        photos: { ...(prev?.photos || {}), [phase]: `sim://${phase}` },
      }));
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    try {
      await auxilioService.uploadAuxilioPhoto(auxilioId, phase, asset.base64 || asset.uri);
      setPhotos((p) => ({ ...p, [phase]: asset.uri }));
      await fetchAuxilio();
    } catch (e) {
      Alert.alert('Error al subir foto', e.response?.data?.message || 'Intentá de nuevo.');
    }
  };

  const goSafetyReject = () =>
    navigation.navigate('RechazoSeguridad', { auxilio, simulation });

  const handlePrimaryAction = async () => {
    switch (step) {
      case RIDER_FLOW_STEPS.EN_RUTA:
        await updateStatus('arribado');
        break;
      case RIDER_FLOW_STEPS.EN_PROCESO:
        setSheet('cierre');
        break;
      case RIDER_FLOW_STEPS.FIRMA:
        navigation.navigate('FirmaConformidad', { auxilioId, auxilio, simulation });
        break;
      case RIDER_FLOW_STEPS.REGRESO:
        await updateStatus('finalizado', { returnCompleted: true });
        Alert.alert('Servicio completado', 'Regreso a base registrado.', [
          { text: 'OK', onPress: () => navigation.getParent()?.navigate('RiderGuardiaTab') },
        ]);
        break;
      default:
        break;
    }
  };

  const statusMeta = {
    [RIDER_FLOW_STEPS.EN_RUTA]: { label: 'EN SERVICIO', tone: 'blue' },
    [RIDER_FLOW_STEPS.FOTO_PRE]: { label: 'EN SERVICIO', tone: 'blue' },
    [RIDER_FLOW_STEPS.FOTO_DURING]: { label: 'EN SERVICIO', tone: 'blue' },
    [RIDER_FLOW_STEPS.EN_PROCESO]: { label: 'EN PROCESO', tone: 'orange' },
    [RIDER_FLOW_STEPS.CIERRE]: { label: 'EN PROCESO', tone: 'orange' },
    [RIDER_FLOW_STEPS.FIRMA]: { label: 'EN PROCESO', tone: 'orange' },
    [RIDER_FLOW_STEPS.REGRESO]: { label: 'REGRESANDO', tone: 'blue' },
  }[step] || { label: 'EN SERVICIO', tone: 'blue' };

  if (!auxilio) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando servicio...</Text>
      </View>
    );
  }

  const renderBottomCard = () => {
    if (step === RIDER_FLOW_STEPS.REGRESO) {
      return (
        <RiderRegresoCard
          baseName={returnBase?.name || returnBase?.address}
          distanceKm={distanceKm}
          etaMinutes={auxilio?.etaMinutes}
          onComplete={handlePrimaryAction}
          loading={loading}
        />
      );
    }
    if (step === RIDER_FLOW_STEPS.EN_PROCESO || step === RIDER_FLOW_STEPS.CIERRE) {
      return (
        <EnProcesoCard
          auxilio={auxilio}
          procesoStartedAt={procesoStartedAt}
          loading={loading}
          onPrimary={handlePrimaryAction}
          onSafetyReject={goSafetyReject}
        />
      );
    }
    if (step === RIDER_FLOW_STEPS.FIRMA) {
      return (
        <View style={styles.card}>
          <Text style={[styles.phase, styles.phaseOrange]}>FIRMA DE CONFORMIDAD</Text>
          <Text style={styles.firmaHint}>Pedile al navegante que firme para cerrar el servicio.</Text>
          <RiderPrimaryButton title="Continuar a firma" onPress={handlePrimaryAction} loading={loading} />
        </View>
      );
    }
    return (
      <EnRutaCard
        auxilio={auxilio}
        etaMinutes={auxilio?.etaMinutes}
        distanceKm={distanceKm}
        metricsLoading={metricsLoading}
        loading={loading}
        onPrimary={handlePrimaryAction}
        onSafetyReject={goSafetyReject}
        onViewVessel={() => navigation.navigate('EmbarcacionAsistida', { auxilio })}
      />
    );
  };

  return (
    <>
      <RiderMapLayout
        region={region}
        onBack={() => navigation.getParent()?.navigate('RiderGuardiaTab')}
        statusLabel={statusMeta.label}
        statusTone={statusMeta.tone}
        displayId={displayId}
        marker={pickupMarker}
        routeCoordinates={routeCoordinates}
        hideRoute={step === RIDER_FLOW_STEPS.REGRESO || step === RIDER_FLOW_STEPS.EN_PROCESO}
        showAnchorOverlay={step === RIDER_FLOW_STEPS.EN_PROCESO}
      >
        {renderBottomCard()}
      </RiderMapLayout>

      <RiderBottomSheet
        visible={sheet === 'foto_pre'}
        onClose={() => setSheet(null)}
        stepLabel="PASO 1 DE 3 · FOTOS OBLIGATORIAS"
        title="Foto previa al remolque"
        subtitle="Tomá una foto que muestre en qué condiciones encontraste la embarcación antes de comenzar el auxilio."
        footer={
          <>
            <RiderPrimaryButton
              title="Continuar a foto de remolque"
              onPress={() => {
                if (!photos.before) {
                  Alert.alert('Foto requerida', 'Tomá la foto previa primero.');
                  return;
                }
                setSheet('foto_during');
              }}
            />
            <RiderSafetyRejectLink onPress={goSafetyReject} />
          </>
        }
      >
        <RiderPhotoCaptureBox captured={!!photos.before} onPress={() => uploadPhoto('before')} />
      </RiderBottomSheet>

      <RiderBottomSheet
        visible={sheet === 'foto_during'}
        onClose={() => setSheet(null)}
        stepLabel="PASO 2 DE 3 · FOTOS OBLIGATORIAS"
        title="Foto durante el remolque"
        subtitle="Tomá una foto que muestre el cabo de remolque conectado a la embarcación auxiliada."
        footer={
          <>
            <RiderPrimaryButton
              title="Confirmar arribo"
              loading={loading}
              onPress={async () => {
                if (!photos.during) {
                  Alert.alert('Foto requerida', 'Tomá la foto durante el remolque.');
                  return;
                }
                const ok = await updateStatus('en_proceso');
                if (ok) setSheet(null);
              }}
            />
            <RiderSafetyRejectLink onPress={goSafetyReject} />
          </>
        }
      >
        <RiderPhotoCaptureBox captured={!!photos.during} onPress={() => uploadPhoto('during')} />
      </RiderBottomSheet>

      <RiderBottomSheet
        visible={sheet === 'cierre'}
        onClose={() => setSheet(null)}
        stepLabel="PASO 3 DE 3 · CIERRE DEL SERVICIO"
        title="Cierre del servicio"
        footer={
          <>
            <RiderPrimaryButton
              title="Continuar a firma"
              loading={loading}
              onPress={async () => {
                if (!photos.after) {
                  Alert.alert('Foto requerida', 'Tomá la foto de embarcación a salvo.');
                  return;
                }
                if (!serviceReason) {
                  Alert.alert('Motivo requerido', 'Seleccioná el motivo del servicio.');
                  return;
                }
                await updateStatus(null, { serviceReason, closureNotes: notes });
                setSheet(null);
                navigation.navigate('FirmaConformidad', { auxilioId, auxilio, simulation });
              }}
            />
            <RiderSafetyRejectLink onPress={goSafetyReject} />
          </>
        }
      >
        <RiderSectionLabel>FOTO · EMBARCACIÓN A SALVO</RiderSectionLabel>
        <RiderPhotoCaptureBox
          captured={!!photos.after}
          onPress={() => uploadPhoto('after')}
          label="Tomar foto · obligatoria"
          hint=""
        />
        <RiderSectionLabel>MOTIVO DEL SERVICIO PRESTADO</RiderSectionLabel>
        <View style={styles.chipGrid}>
          {SERVICE_REASON_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.chip, serviceReason === opt.id && styles.chipActive]}
              onPress={() => setServiceReason(opt.id)}
            >
              <Text style={[styles.chipText, serviceReason === opt.id && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <RiderSectionLabel optional>NOTAS ADICIONALES</RiderSectionLabel>
        <TextInput
          style={styles.notesInput}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Contanos qué pasó..."
          placeholderTextColor={COLORS.textMuted}
        />
      </RiderBottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.riderNavy, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.riderCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    gap: SIZES.md,
  },
  phase: { color: COLORS.riderBlue, fontSize: SIZES.caption, fontWeight: '700', letterSpacing: 1 },
  phaseOrange: { color: COLORS.riderOrange },
  firmaHint: { color: COLORS.textSecondary, lineHeight: 22 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.md },
  chip: {
    width: '48%',
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.riderCardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { borderColor: COLORS.riderBlue },
  chipText: { color: COLORS.textSecondary, textAlign: 'center' },
  chipTextActive: { color: COLORS.text, fontWeight: '700' },
  notesInput: {
    backgroundColor: COLORS.riderCardElevated,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default ServicioActivoScreen;
