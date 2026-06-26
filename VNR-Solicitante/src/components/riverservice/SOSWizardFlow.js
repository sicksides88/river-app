import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../common';
import StepperHorizontal from './StepperHorizontal';
import SOSStepServicio from './SOSStepServicio';
import {
  COLORS,
  SIZES,
  EMERGENCY_TYPES,
  EMERGENCY_GRID_OPTIONS,
  EMERGENCY_HEALTH_OPTION,
  FAILURE_CHIPS,
} from '../../constants/theme';
import { auxilioService, locationService, mapsService, vesselService } from '../../services';
import { formatVesselSubtitle } from '../../utils/vesselForm';

const STEPS = ['Servicio', 'Ubicación', 'Confirmar'];

const STEP_HEADERS = [
  { title: 'Detalle del Auxilio', subtitle: 'Seleccioná el estado de tu embarcación' },
  { title: 'Confirmá tu ubicación', subtitle: 'Paso 2 de 3' },
  { title: 'Confirmá tu solicitud', subtitle: 'Paso 3 de 3' },
];

const DANGER_EMERGENCY = ['via_agua', 'salud'];

const getEmergencyMeta = (id) =>
  EMERGENCY_TYPES.find((e) => e.id === id) || { label: id, icon: 'help-circle-outline' };

const formatCoords = (lat, lng) =>
  `Lat ${Number(lat).toFixed(4)}° · Lon ${Number(lng).toFixed(4)}°`;

const isCoordsLabel = (text) => /^Lat\s/i.test(String(text || '').trim());

const resolveAddressFromCoords = async (lat, lng) => {
  try {
    const result = await mapsService.reverseGeocode(lat, lng);
    const formatted =
      result?.formattedAddress || result?.formatted_address || result?.address;
    if (formatted) return formatted;
  } catch {
    // fallback a coordenadas
  }
  return formatCoords(lat, lng);
};

const buildLocationSummary = (location, useGps, reference) => {
  if (!location) return { title: '—', detail: null };

  const coords = formatCoords(location.lat, location.lng);
  const ref = reference.trim();
  const geoLabel =
    location.address && !isCoordsLabel(location.address) ? location.address : null;

  let title;
  let detail = coords;

  if (ref) {
    title = ref;
    if (geoLabel) detail = `${geoLabel}\n${coords}`;
  } else if (geoLabel) {
    title = geoLabel;
  } else {
    title = useGps ? 'Ubicación GPS' : 'Ubicación en el mapa';
  }

  if (useGps && location.accuracy != null) {
    detail = `${coords} · ±${Math.round(location.accuracy)} m`;
  }

  return { title, detail };
};

const buildSubmitAddress = (location, reference) => {
  const coords = formatCoords(location.lat, location.lng);
  const ref = reference.trim();
  const geo =
    location.address && !isCoordsLabel(location.address) ? location.address : null;

  if (ref && geo) return `${ref} · ${geo} · ${coords}`;
  if (ref) return `${ref} · ${coords}`;
  if (geo) return `${geo} · ${coords}`;
  return coords;
};

const getUserPhone = (user) => {
  const code = user?.telefono?.codigoPais || '+54';
  const num = user?.telefono?.numero || '';
  if (!num) return '—';
  return `${code} ${num}`.replace(/\s+/g, ' ').trim();
};

const SummaryCard = ({ label, icon, iconBg, title, detail, danger }) => (
  <View style={[styles.summaryCard, danger && styles.summaryCardDanger]}>
    <View style={[styles.summaryIcon, danger && styles.summaryIconDanger, iconBg && { backgroundColor: iconBg }]}>
      {icon}
    </View>
    <View style={styles.summaryBody}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryTitle, danger && styles.summaryTitleDanger]} numberOfLines={2}>
        {title}
      </Text>
      {detail ? (
        <Text style={styles.summaryDetail} numberOfLines={4}>
          {detail}
        </Text>
      ) : null}
    </View>
  </View>
);

export const SOSWizardFlow = ({
  vessel: initialVessel,
  user,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(0);
  const [vessel, setVessel] = useState(initialVessel);
  const [emergencyType, setEmergencyType] = useState(null);
  const [failureTypes, setFailures] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [useGps, setUseGps] = useState(true);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setEmergencyType(null);
    setFailures([]);
    setLocation(null);
    setUseGps(true);
    setReference('');
    setSubmitting(false);
  }, []);

  useEffect(() => {
    setVessel(initialVessel);
    reset();
  }, [initialVessel, reset]);

  const applyCoords = useCallback(async (lat, lng, accuracy = null) => {
    setLocation({
      lat,
      lng,
      accuracy,
      address: formatCoords(lat, lng),
    });
    const address = await resolveAddressFromCoords(lat, lng);
    setLocation((prev) =>
      prev && prev.lat === lat && prev.lng === lng ? { ...prev, address } : prev
    );
  }, []);

  const loadLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const loc = await locationService.getCurrentLocation();
      await applyCoords(loc.latitude, loc.longitude, loc.accuracy);
    } catch {
      setUseGps(false);
      Alert.alert(
        'GPS no disponible',
        'No pudimos obtener tu ubicación. Marcá el punto en el mapa o ingresá una referencia manual.'
      );
    } finally {
      setLocationLoading(false);
    }
  }, [applyCoords]);

  useEffect(() => {
    if (step === 1 && useGps && !location) {
      loadLocation();
    }
  }, [step, useGps, location, loadLocation]);

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleBack = () => {
    if (step === 0) handleClose();
    else setStep((s) => s - 1);
  };

  const toggleFailure = (f) => {
    setFailures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const locationSummary = buildLocationSummary(location, useGps, reference);

  const vesselTitle = [vessel?.name, vessel?.registration].filter(Boolean).join(' · ');
  const vesselDetail = formatVesselSubtitle(vessel)
    .split(' · ')
    .filter((part) => part !== vessel?.registration)
    .join(' · ');

  const emergencyMeta = getEmergencyMeta(emergencyType);
  const isDangerEmergency = DANGER_EMERGENCY.includes(emergencyType);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let vesselForAuxilio = vessel;
      if (vessel?.id) {
        try {
          const fresh = await vesselService.getVesselById(vessel.id);
          vesselForAuxilio = fresh.vessel || vessel;
        } catch {
          vesselForAuxilio = vessel;
        }
      }

      const locPayload = {
        ...location,
        address: buildSubmitAddress(location, reference),
        reference: reference.trim() || undefined,
      };

      const result = await auxilioService.createAuxilio({
        vessel: vesselForAuxilio,
        emergencyType,
        failureTypes,
        location: locPayload,
        linkType: user?.link_type || 'independiente',
      });

      if (result.success && result.auxilio) {
        reset();
        onSuccess?.(result.auxilio);
      } else {
        Alert.alert('Error', result.message || 'No se pudo crear la solicitud');
      }
    } catch {
      Alert.alert('Error', 'No se pudo enviar el auxilio. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const header = STEP_HEADERS[step];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.header, step === 0 && styles.headerStep0]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          {step === 0 ? (
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitleLeft}>{header.title}</Text>
              <Text style={styles.headerSubtitleLeft}>{header.subtitle}</Text>
            </View>
          ) : (
            <>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{header.title}</Text>
                <Text style={styles.headerStep}>{header.subtitle}</Text>
              </View>
              <View style={styles.headerSpacer} />
            </>
          )}
        </View>

        <StepperHorizontal steps={STEPS} currentStep={step} />

        {step === 0 && (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.stepScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SOSStepServicio
                emergencyType={emergencyType}
                onSelectEmergency={setEmergencyType}
                failureTypes={failureTypes}
                onToggleFailure={toggleFailure}
                gridOptions={EMERGENCY_GRID_OPTIONS}
                healthOption={EMERGENCY_HEALTH_OPTION}
                failureOptions={FAILURE_CHIPS}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Continuar"
                onPress={() => setStep(1)}
                disabled={!emergencyType}
              />
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 1 && (
          <View style={styles.flex}>
            <View style={styles.mapWrap}>
              {locationLoading ? (
                <ActivityIndicator size="large" color={COLORS.info} style={styles.mapLoader} />
              ) : location ? (
                <MapView
                  key={useGps ? 'gps' : 'manual'}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  {...(useGps
                    ? {
                        region: {
                          latitude: location.lat,
                          longitude: location.lng,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        },
                      }
                    : {})}
                  scrollEnabled={!useGps}
                  zoomEnabled={!useGps}
                  onPress={(e) => {
                    if (useGps) return;
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    applyCoords(latitude, longitude, null);
                  }}
                >
                  <Marker
                    coordinate={{ latitude: location.lat, longitude: location.lng }}
                    draggable={!useGps}
                    pinColor={COLORS.sos}
                    onDragEnd={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      applyCoords(latitude, longitude, null);
                    }}
                  />
                </MapView>
              ) : null}
              {!useGps && location ? (
                <View style={styles.mapHint} pointerEvents="none">
                  <Text style={styles.mapHintText}>
                    Tocá el mapa o arrastrá el pin para marcar tu ubicación
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.locationSheet}>
              <Text style={styles.sheetLabel}>
                {useGps ? 'UBICACIÓN DETECTADA' : 'UBICACIÓN MANUAL'}
              </Text>

              <View style={styles.locationRow}>
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={20} color={COLORS.info} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>{locationSummary.title}</Text>
                  {locationSummary.detail ? (
                    <Text style={styles.locationCoords}>{locationSummary.detail}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Usar mi ubicación actual</Text>
                  <Text style={styles.toggleHint}>
                    {useGps
                      ? `GPS · precisión ${location?.accuracy ? `±${Math.round(location.accuracy)} m` : '—'}`
                      : 'Desactivado · marcá el punto en el mapa'}
                  </Text>
                </View>
                <Switch
                  value={useGps}
                  onValueChange={(v) => {
                    setUseGps(v);
                    if (v) {
                      loadLocation();
                    }
                  }}
                  trackColor={{ false: COLORS.border, true: COLORS.info }}
                  thumbColor={COLORS.white}
                />
              </View>

              <Text style={styles.inputLabel}>REFERENCIA (opcional)</Text>
              <TextInput
                style={styles.input}
                value={reference}
                onChangeText={setReference}
                placeholder="Frente al Club Náutico..."
                placeholderTextColor={COLORS.textMuted}
              />

              <Button
                title="Continuar"
                onPress={() => setStep(2)}
                disabled={!location}
                style={styles.sheetBtn}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.flex}>
            <ScrollView
              contentContainerStyle={styles.stepScroll}
              showsVerticalScrollIndicator={false}
            >
              <SummaryCard
                label="UBICACIÓN"
                icon={<Ionicons name="radio-button-on" size={20} color={COLORS.info} />}
                title={locationSummary.title}
                detail={locationSummary.detail}
              />

              <SummaryCard
                label="EMBARCACIÓN"
                icon={<Ionicons name="boat" size={22} color={COLORS.text} />}
                title={vesselTitle || '—'}
                detail={vesselDetail || null}
              />

              <SummaryCard
                label="TIPO DE AUXILIO"
                icon={
                  <MaterialCommunityIcons
                    name={emergencyType === 'via_agua' ? 'water' : 'alert-circle-outline'}
                    size={22}
                    color={isDangerEmergency ? COLORS.error : COLORS.info}
                  />
                }
                iconBg={isDangerEmergency ? 'rgba(239, 68, 68, 0.15)' : undefined}
                title={emergencyMeta.label}
                danger={isDangerEmergency}
              />

              <SummaryCard
                label="CONTACTO"
                icon={<Ionicons name="call-outline" size={20} color={COLORS.info} />}
                title={getUserPhone(user)}
              />

              {failureTypes.length > 0 ? (
                <Text style={styles.failuresNote}>
                  Fallas reportadas: {failureTypes.join(', ')}
                </Text>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Enviar solicitud de auxilio"
                onPress={handleSubmit}
                loading={submitting}
              />
              <Text style={styles.disclaimer}>
                Al enviar, tu pedido queda como Solicitado y un operador lo asignará a una
                tripulación.
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xs,
  },
  headerStep0: {
    alignItems: 'flex-start',
    paddingBottom: SIZES.sm,
  },
  headerLeft: {
    flex: 1,
    paddingRight: SIZES.md,
  },
  headerTitleLeft: {
    color: COLORS.text,
    fontSize: SIZES.h3,
    fontWeight: '700',
  },
  headerSubtitleLeft: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    marginTop: 4,
    lineHeight: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: {
    color: COLORS.text,
    fontSize: SIZES.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerStep: {
    color: COLORS.info,
    fontSize: SIZES.caption,
    marginTop: 2,
    fontWeight: '600',
  },
  stepScroll: {
    paddingBottom: SIZES.lg,
  },
  mapWrap: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  map: { ...StyleSheet.absoluteFillObject },
  mapLoader: { flex: 1, alignSelf: 'center' },
  mapHint: {
    position: 'absolute',
    left: SIZES.md,
    right: SIZES.md,
    top: SIZES.md,
    backgroundColor: 'rgba(11, 18, 32, 0.82)',
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapHintText: {
    color: COLORS.text,
    fontSize: SIZES.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  locationSheet: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.lg,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetLabel: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInfo: { flex: 1 },
  locationTitle: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  locationCoords: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleText: { flex: 1, paddingRight: SIZES.md },
  toggleTitle: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '600' },
  toggleHint: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.sm,
  },
  input: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    color: COLORS.text,
    fontSize: SIZES.body,
    marginBottom: SIZES.md,
  },
  sheetBtn: { marginTop: SIZES.xs },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryCardDanger: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIconDanger: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  summaryBody: { flex: 1 },
  summaryLabel: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  summaryTitleDanger: { color: COLORS.error },
  summaryDetail: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    marginTop: 4,
    lineHeight: 18,
  },
  failuresNote: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    textAlign: 'center',
    marginTop: SIZES.sm,
    lineHeight: 18,
  },
});

export default SOSWizardFlow;
