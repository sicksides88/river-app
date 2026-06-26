import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderScreenShell, RiderPrimaryButton } from '../../components/rider';
import { SignaturePad } from '../../components/riverservice';
import { auxilioService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { isSimulationAuxilio } from '../../constants/demoAuxilio';

const FirmaConformidadScreen = ({ navigation, route }) => {
  const { auxilioId, auxilio, simulation: simulationParam } = route.params || {};
  const simulation = simulationParam || isSimulationAuxilio(auxilio);
  const [loading, setLoading] = useState(false);

  const handleSave = async (signature) => {
    setLoading(true);
    try {
      if (!simulation) {
        await auxilioService.saveSignature(auxilioId, signature);
      }
      navigation.replace('ServicioActivo', {
        auxilioId,
        simulation,
        auxilio: { ...auxilio, signature, simulation: true },
      });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar la firma.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderScreenShell
      title="Firma de Conformidad"
      subtitle="Pedile al navegante que firme acá para finalizar el servicio. Como en un posnet."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.body}>
        <View style={styles.padWrap}>
          <SignaturePad
            onSave={handleSave}
            height={220}
            placeholder="Firmá aquí"
            confirmLabel="Finalizar"
            clearLabel="Limpiar"
            padBackground={COLORS.riderCardElevated}
            strokeColor={COLORS.text}
            placeholderColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="mail-outline" size={20} color={COLORS.riderBlue} />
          <Text style={styles.infoText}>
            El navegante recibirá el detalle del servicio por email al confirmar.
          </Text>
        </View>
        {loading ? <RiderPrimaryButton title="Guardando..." loading disabled /> : null}
      </View>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, padding: SIZES.screenPadding },
  padWrap: { flex: 1, marginBottom: SIZES.lg },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.riderBlue,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  infoText: { flex: 1, color: COLORS.textSecondary, lineHeight: 20 },
});

export default FirmaConformidadScreen;
