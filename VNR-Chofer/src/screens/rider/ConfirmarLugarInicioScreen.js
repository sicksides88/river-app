import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, ScrollView, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  RiderScreenShell,
  RiderPrimaryButton,
  RiderSectionLabel,
} from '../../components/rider';
import { auxilioService } from '../../services';
import { COLORS, SIZES, RIDER_MAP_STYLE } from '../../constants/theme';
import { isSimulationAuxilio, advanceSimulationStatus } from '../../constants/demoAuxilio';
import { extractPickupCoordinate, isValidLatLng, toMapRegion } from '../../utils/mapCoordinates';

const ETA_OPTIONS = ['15', '20', '25', '30', '45'];
const BASES = ['Base Rosario', 'Base Paraná', 'Base Tigre'];

const ConfirmarLugarInicioScreen = ({ navigation, route }) => {
  const { auxilioId, auxilio, simulation: simulationParam } = route.params || {};
  const simulation = simulationParam || isSimulationAuxilio(auxilio);
  const [useGps, setUseGps] = useState(true);
  const [base, setBase] = useState(BASES[0]);
  const [eta, setEta] = useState(String(auxilio?.etaMinutes || '25'));
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState(() =>
    toMapRegion(
      auxilio?.pickup?.coordinates?.lat ?? auxilio?.pickup?.lat,
      auxilio?.pickup?.coordinates?.lng ?? auxilio?.pickup?.lng,
      { latitudeDelta: 0.05, longitudeDelta: 0.05 }
    )
  );

  const startMarker = isValidLatLng(region.latitude, region.longitude)
    ? { latitude: region.latitude, longitude: region.longitude }
    : null;

  const handleStart = async () => {
    setLoading(true);
    try {
      const nextAuxilio = advanceSimulationStatus(auxilio, 'zarpado', {
        departureBase: base,
        reference,
        etaMinutes: Number(eta),
      });

      if (!simulation) {
        await auxilioService.updateAuxilioStatus(auxilioId, 'zarpado', {
          departureBase: base,
          reference,
          etaMinutes: Number(eta),
        });
      }

      navigation.getParent()?.navigate('RiderServicioTab', {
        screen: 'ServicioActivo',
        params: {
          simulation,
          auxilioId,
          auxilio: nextAuxilio,
        },
      });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo confirmar el zarpado.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!useGps) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setRegion((r) => ({
        ...r,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
    })();
  }, [useGps]);

  return (
    <RiderScreenShell title="Confirmá lugar de inicio" subtitle="¿Desde dónde estás iniciando el servicio?" onBack={() => navigation.getParent()?.navigate('RiderGuardiaTab')}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mapWrap}>
          <MapView style={styles.map} provider={PROVIDER_GOOGLE} customMapStyle={RIDER_MAP_STYLE} region={region}>
            {startMarker ? <Marker coordinate={startMarker} /> : null}
          </MapView>
        </View>

        <RiderSectionLabel>BASE DE PARTIDA</RiderSectionLabel>
        <View style={styles.selectRow}>
          <Text style={styles.selectText}>{base}</Text>
        </View>
        {BASES.filter((b) => b !== base).map((b) => (
          <Text key={b} style={styles.altBase} onPress={() => setBase(b)}>{b}</Text>
        ))}

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Usar mi ubicación actual</Text>
            <Text style={styles.toggleHint}>GPS activo para el servicio</Text>
          </View>
          <Switch value={useGps} onValueChange={setUseGps} trackColor={{ true: COLORS.riderBlue }} />
        </View>

        <RiderSectionLabel>TIEMPO ESTIMADO DE LLEGADA (ETA)</RiderSectionLabel>
        <View style={styles.etaRow}>
          {ETA_OPTIONS.map((opt) => (
            <Text
              key={opt}
              style={[styles.etaChip, eta === opt && styles.etaChipActive]}
              onPress={() => setEta(opt)}
            >
              {opt} MIN
            </Text>
          ))}
        </View>

        <RiderSectionLabel optional>REFERENCIA</RiderSectionLabel>
        <TextInput
          style={styles.input}
          value={reference}
          onChangeText={setReference}
          placeholder="Frente al Club Náutico..."
          placeholderTextColor={COLORS.textMuted}
        />

        <RiderPrimaryButton title="Zarpar y comenzar servicio" onPress={handleStart} loading={loading} style={styles.btn} />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  mapWrap: { height: 180, borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: SIZES.lg },
  map: { flex: 1 },
  selectRow: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.sm,
  },
  selectText: { color: COLORS.text, fontWeight: '600' },
  altBase: { color: COLORS.riderBlue, marginBottom: 4, fontSize: SIZES.caption },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  toggleTitle: { color: COLORS.text, fontWeight: '600' },
  toggleHint: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: 2 },
  etaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.lg },
  etaChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.riderCard,
    color: COLORS.textSecondary,
    overflow: 'hidden',
  },
  etaChipActive: { backgroundColor: COLORS.riderBlue, color: COLORS.white, fontWeight: '700' },
  input: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
  },
  btn: { marginTop: SIZES.md },
});

export default ConfirmarLugarInicioScreen;
