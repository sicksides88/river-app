import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common';
import { TopBar, StepperHorizontal, GlassCard, VesselInfoBlock } from '../../components/riverservice';
import { auxilioService, vesselService } from '../../services';
import { EMERGENCY_TYPES, COLORS, SIZES } from '../../constants/theme';

const SOSConfirmarScreen = ({ navigation, route }) => {
  const { vessel, emergencyType, failureTypes, location } = route.params || {};
  const [loading, setLoading] = useState(false);

  const emergencyLabel = EMERGENCY_TYPES.find((e) => e.id === emergencyType)?.label || emergencyType;

  const handleConfirm = async () => {
    setLoading(true);
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

      const result = await auxilioService.createAuxilio({
        vessel: vesselForAuxilio,
        emergencyType,
        failureTypes,
        location,
        linkType: 'independiente',
      });
      if (result.success && result.auxilio) {
        navigation.replace('AuxilioTracking', {
          auxilioId: result.auxilio.id,
          auxilio: result.auxilio,
        });
      } else {
        Alert.alert('Error', result.message || 'No se pudo crear la solicitud');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar el auxilio. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopBar title="Confirmar auxilio" onBack={() => navigation.goBack()} />
      <StepperHorizontal steps={['Servicio', 'Ubicación', 'Confirmar']} currentStep={2} />
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard>
          <Text style={styles.sectionLabel}>Embarcación a auxiliar</Text>
          <Text style={styles.sectionHint}>
            El patrón verá estos datos al recibir tu solicitud.
          </Text>
          <VesselInfoBlock vessel={vessel} style={styles.vesselBlock} />

          <Text style={styles.label}>Emergencia</Text>
          <Text style={styles.value}>{emergencyLabel}</Text>
          {failureTypes?.length > 0 && (
            <>
              <Text style={styles.label}>Fallas</Text>
              <Text style={styles.value}>{failureTypes.join(', ')}</Text>
            </>
          )}
          <Text style={styles.label}>Ubicación</Text>
          <Text style={styles.value}>{location?.address}</Text>
        </GlassCard>
        <Text style={styles.disclaimer}>
          Al confirmar, River Service buscará el patrón más cercano disponible.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button title="SOS · PEDIR AUXILIO" onPress={handleConfirm} loading={loading} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.screenPadding },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    marginBottom: SIZES.md,
    lineHeight: 18,
  },
  vesselBlock: { marginBottom: SIZES.md },
  label: { color: COLORS.textMuted, fontSize: SIZES.caption, marginTop: SIZES.sm },
  value: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '600' },
  disclaimer: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: SIZES.lg, textAlign: 'center' },
  footer: { padding: SIZES.screenPadding, borderTopWidth: 1, borderTopColor: COLORS.border },
});

export default SOSConfirmarScreen;
