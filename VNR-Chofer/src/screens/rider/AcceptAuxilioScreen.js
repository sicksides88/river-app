import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  RiderScreenShell,
  RiderPrimaryButton,
  RiderSectionLabel,
  RiderEmergencyBanner,
} from '../../components/rider';
import { SolicitanteInfoBlock, VesselInfoBlock } from '../../components/riverservice';
import { auxilioService, driverService } from '../../services';
import { COLORS, SIZES, EMERGENCY_TYPES, RIDER_MAP_STYLE } from '../../constants/theme';
import { isSimulationAuxilio, advanceSimulationStatus } from '../../constants/demoAuxilio';
import { extractPickupCoordinate, toMapRegion } from '../../utils/mapCoordinates';

const ETA_OPTIONS = ['15', '20', '25', '30', '45'];

const getEmergencyLabel = (type) =>
  EMERGENCY_TYPES.find((e) => e.id === type)?.label || type || 'Auxilio náutico';

const AcceptAuxilioScreen = ({ navigation, route }) => {
  const { auxilio, simulation: simulationParam } = route.params || {};
  const simulation = simulationParam || isSimulationAuxilio(auxilio);
  const [etaMinutes, setEtaMinutes] = useState('25');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    const eta = parseInt(etaMinutes, 10);
    if (!eta || eta < 1) {
      Alert.alert('ETA requerida', 'Ingresá cuántos minutos tardás en llegar.');
      return;
    }

    setLoading(true);
    try {
      if (simulation) {
        navigation.getParent()?.navigate('RiderServicioTab', {
          screen: 'ConfirmarLugarInicio',
          params: {
            simulation: true,
            auxilioId: auxilio.id,
            auxilio: advanceSimulationStatus(auxilio, 'asignado', { etaMinutes: eta }),
          },
        });
        return;
      }

      let vehicleId;
      try {
        const vehiclesRes = await driverService.getVehicles();
        vehicleId = vehiclesRes.vehicles?.[0]?.id;
      } catch {
        // Patrón náutico puede no tener vehículo terrestre registrado
      }

      const res = await auxilioService.acceptAuxilio(auxilio.id, { vehicleId, etaMinutes: eta });
      if (res.success === false) {
        Alert.alert('Error', res.message || 'No se pudo aceptar el auxilio.');
        return;
      }
      navigation.getParent()?.navigate('RiderServicioTab', {
        screen: 'ConfirmarLugarInicio',
        params: {
          auxilioId: auxilio.id,
          auxilio: { ...auxilio, etaMinutes: eta, status: 'asignado' },
        },
      });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error al aceptar el auxilio.');
    } finally {
      setLoading(false);
    }
  };

  const address = auxilio?.pickup?.address || 'Ubicación del auxilio';

  const pickupCoord = useMemo(
    () => extractPickupCoordinate(auxilio?.pickup, null),
    [auxilio?.pickup]
  );

  const mapRegion = useMemo(
    () =>
      pickupCoord
        ? toMapRegion(pickupCoord.latitude, pickupCoord.longitude, {
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          })
        : null,
    [pickupCoord]
  );

  return (
    <RiderScreenShell title="Aceptar auxilio" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <RiderEmergencyBanner label={getEmergencyLabel(auxilio?.emergencyType)} />

        {mapRegion ? (
          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              customMapStyle={RIDER_MAP_STYLE}
              initialRegion={mapRegion}
              scrollEnabled
              zoomEnabled
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker coordinate={pickupCoord} pinColor={COLORS.sos} />
            </MapView>
          </View>
        ) : null}

        <View style={styles.card}>
          <RiderSectionLabel>EMBARCACIÓN A AUXILIAR</RiderSectionLabel>
          <VesselInfoBlock auxilio={auxilio} style={styles.block} />
          <RiderSectionLabel>NAVEGANTE</RiderSectionLabel>
          <SolicitanteInfoBlock auxilio={auxilio} style={styles.block} />
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={COLORS.riderBlue} />
            <Text style={styles.address}>{address}</Text>
          </View>
        </View>

        <RiderSectionLabel>TIEMPO ESTIMADO DE ARRIBO</RiderSectionLabel>
        <View style={styles.etaRow}>
          {ETA_OPTIONS.map((opt) => (
            <Text
              key={opt}
              style={[styles.etaChip, etaMinutes === opt && styles.etaChipActive]}
              onPress={() => setEtaMinutes(opt)}
            >
              {opt} MIN
            </Text>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={etaMinutes}
          onChangeText={setEtaMinutes}
          keyboardType="number-pad"
          placeholder="Otro valor en minutos"
          placeholderTextColor={COLORS.textMuted}
        />

        <RiderPrimaryButton title="Confirmar y aceptar" onPress={handleAccept} loading={loading} style={styles.btn} />
        <RiderPrimaryButton
          title="Rechazar auxilio"
          variant="outline"
          onPress={() => navigation.navigate('RejectAuxilio', { auxilio })}
        />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  mapWrap: {
    height: 200,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: { flex: 1 },
  card: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
  },
  block: { marginBottom: SIZES.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm, marginTop: SIZES.sm },
  address: { flex: 1, color: COLORS.text, lineHeight: 20 },
  etaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.sm },
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
  btn: { marginBottom: SIZES.sm },
});

export default AcceptAuxilioScreen;
