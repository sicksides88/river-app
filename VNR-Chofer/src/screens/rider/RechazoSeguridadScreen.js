import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  RiderScreenShell,
  RiderPrimaryButton,
  RiderSectionLabel,
} from '../../components/rider';
import { auxilioService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { isSimulationAuxilio } from '../../constants/demoAuxilio';

const RechazoSeguridadScreen = ({ navigation, route }) => {
  const { auxilio, simulation: simulationParam } = route.params || {};
  const simulation = simulationParam || isSimulationAuxilio(auxilio);
  const [reason, setReason] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      Alert.alert('Motivo requerido', 'Describí por qué rechazás por seguridad.');
      return;
    }
    if (!photoUri && !simulation) {
      Alert.alert('Foto obligatoria', 'Tomá una foto que respalde la decisión.');
      return;
    }
    setLoading(true);
    try {
      if (simulation) {
        Alert.alert('Demo', 'Rechazo por seguridad registrado (simulación).');
        navigation.getParent()?.navigate('RiderGuardiaTab');
        return;
      }
      await auxilioService.uploadAuxilioPhoto(auxilio.id, 'safety_rejection', photoUri);
      await auxilioService.reportProblem(auxilio.id, `[SEGURIDAD] ${reason}`);
      await auxilioService.rejectAuxilio(auxilio.id, reason);
      navigation.getParent()?.navigate('RiderGuardiaTab');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar el rechazo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RiderScreenShell onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="shield-outline" size={22} color={COLORS.riderRed} />
          <Text style={styles.title}>Rechazo por seguridad</Text>
        </View>
        <Text style={styles.subtitle}>Dejá constancia del motivo y una foto.</Text>

        <Text style={styles.bodyText}>
          Estás rechazando la realización del auxilio. Necesitamos que dejes constancia de las razones por las que
          decidiste no prestar el servicio y una foto que acompañe esa decisión.
        </Text>
        <Text style={styles.bodyText}>
          Esta decisión será informada al operador de auxilio, quien se comunicará con el cliente y definirá una nueva
          resolución. El patrón no contacta al cliente.
        </Text>

        <RiderSectionLabel>MOTIVO DEL RECHAZO</RiderSectionLabel>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={reason}
          onChangeText={setReason}
          placeholder="Embarcación hace agua, remolque puede causar hundimiento..."
          placeholderTextColor={COLORS.textMuted}
        />

        <RiderSectionLabel>FOTO QUE RESPALDE LA DECISIÓN</RiderSectionLabel>
        <TouchableOpacity style={styles.photoBox} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={28} color={COLORS.riderRed} />
          <Text style={styles.photoText}>
            {photoUri ? 'Foto capturada · tocar para cambiar' : 'Tomar foto · obligatoria'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <RiderPrimaryButton title="Volver" variant="outline" onPress={() => navigation.goBack()} style={styles.half} />
          <RiderPrimaryButton
            title="Confirmar rechazo"
            variant="danger"
            onPress={handleConfirm}
            loading={loading}
            style={styles.half}
          />
        </View>
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.sm },
  title: { color: COLORS.riderRed, fontSize: SIZES.h3, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 22, marginBottom: SIZES.md },
  bodyText: { color: COLORS.textSecondary, lineHeight: 22, marginBottom: SIZES.md },
  input: {
    backgroundColor: COLORS.riderCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  photoBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.riderRed,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  photoText: { color: COLORS.riderRed, fontWeight: '600', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: SIZES.sm },
  half: { flex: 1 },
});

export default RechazoSeguridadScreen;
