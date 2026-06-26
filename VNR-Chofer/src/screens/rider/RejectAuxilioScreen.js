import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderScreenShell, RiderPrimaryButton, RiderRadioList } from '../../components/rider';
import { auxilioService } from '../../services';
import { COLORS, SIZES, REJECT_REASON_OPTIONS } from '../../constants/theme';
import { isSimulationAuxilio } from '../../constants/demoAuxilio';

const RejectAuxilioScreen = ({ navigation, route }) => {
  const { auxilio, simulation: simulationParam } = route.params || {};
  const simulation = simulationParam || isSimulationAuxilio(auxilio);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    const option = REJECT_REASON_OPTIONS.find((o) => o.id === selectedReason);
    const reason = selectedReason === 'otro' ? customReason.trim() : option?.label;
    if (!reason) {
      Alert.alert('Motivo requerido', 'Seleccioná o escribí un motivo de rechazo.');
      return;
    }

    setLoading(true);
    try {
      if (!simulation) {
        await auxilioService.rejectAuxilio(auxilio.id, reason);
      } else {
        Alert.alert('Demo', 'Auxilio rechazado (simulación).');
      }
      navigation.getParent()?.navigate('RiderGuardiaTab');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo rechazar el auxilio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderScreenShell title="Rechazar auxilio" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>Indicá el motivo para que podamos reasignar el auxilio.</Text>

        <RiderRadioList
          options={REJECT_REASON_OPTIONS}
          value={selectedReason}
          onChange={setSelectedReason}
        />

        {selectedReason === 'otro' && (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Describí el motivo..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
          />
        )}

        <TouchableOpacity
          style={styles.securityLink}
          onPress={() => navigation.navigate('RechazoSeguridad', { auxilio, simulation })}
        >
          <Ionicons name="shield-outline" size={20} color={COLORS.riderRed} />
          <Text style={styles.securityText}>Rechazo por seguridad (foto obligatoria)</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.riderRed} />
        </TouchableOpacity>

        <RiderPrimaryButton
          title="Confirmar rechazo"
          variant="danger"
          onPress={handleReject}
          loading={loading}
          style={styles.btn}
        />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  subtitle: { color: COLORS.textSecondary, marginBottom: SIZES.lg, lineHeight: 22 },
  input: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SIZES.md,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  securityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: COLORS.riderRedMuted,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.riderRed,
  },
  securityText: { flex: 1, color: COLORS.riderRed, fontWeight: '600', fontSize: SIZES.caption },
  btn: { marginTop: SIZES.md },
});

export default RejectAuxilioScreen;
