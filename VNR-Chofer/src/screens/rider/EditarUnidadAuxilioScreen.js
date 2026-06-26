import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RiderScreenShell, RiderPrimaryButton, RiderTextField, RiderSectionLabel } from '../../components/rider';
import driverService from '../../services/driver.service';
import { COLORS, SIZES } from '../../constants/theme';
import {
  EMPTY_BOAT_FORM,
  formToVehiclePayload,
  vehicleToForm,
} from '../../utils/riderBoat';

const EditarUnidadAuxilioScreen = ({ navigation, route }) => {
  const vehicleId = route.params?.vehicleId || null;
  const isEdit = !!vehicleId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_BOAT_FORM });

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const load = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const res = await driverService.getVehicles();
      const vehicle = (res?.vehicles || []).find((v) => v.id === vehicleId);
      if (vehicle) setForm(vehicleToForm(vehicle));
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos de la unidad.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [vehicleId]));

  const handleSave = async () => {
    if (!form.plateNumber?.trim()) {
      Alert.alert('Matrícula requerida', 'Indicá la matrícula de la embarcación.');
      return;
    }
    if (!form.name?.trim()) {
      Alert.alert('Nombre requerido', 'Indicá un nombre para identificar la unidad.');
      return;
    }

    setSaving(true);
    try {
      const payload = formToVehiclePayload(form);
      const res = isEdit
        ? await driverService.updateVehicle(vehicleId, payload)
        : await driverService.addVehicle(payload);

      if (res?.success) {
        Alert.alert(
          isEdit ? 'Unidad actualizada' : 'Unidad registrada',
          'Los datos de tu embarcación de auxilio quedaron guardados.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', res?.message || 'No se pudo guardar.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RiderScreenShell
        title={isEdit ? 'Editar unidad' : 'Agregar unidad'}
        headerIcon="boat"
        onBack={() => navigation.goBack()}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.riderBlue} />
        </View>
      </RiderScreenShell>
    );
  }

  return (
    <RiderScreenShell
      title={isEdit ? 'Editar unidad' : 'Agregar unidad'}
      subtitle="Embarcación de auxilio · datos técnicos"
      headerIcon="boat"
      onBack={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <RiderSectionLabel>IDENTIFICACIÓN</RiderSectionLabel>
        <RiderTextField label="Nombre de la unidad" value={form.name} onChangeText={(v) => setField('name', v)} />
        <RiderTextField label="Matrícula" value={form.plateNumber} onChangeText={(v) => setField('plateNumber', v)} />
        <RiderTextField label="Color" value={form.color} onChangeText={(v) => setField('color', v)} />

        <RiderSectionLabel>DATOS TÉCNICOS</RiderSectionLabel>
        <RiderTextField label="Eslora (m)" value={form.lengthM} onChangeText={(v) => setField('lengthM', v)} keyboardType="decimal-pad" />
        <RiderTextField label="Manga (m)" value={form.beamM} onChangeText={(v) => setField('beamM', v)} keyboardType="decimal-pad" />
        <RiderTextField label="Calado (m)" value={form.draftM} onChangeText={(v) => setField('draftM', v)} keyboardType="decimal-pad" />
        <RiderTextField
          label="Capacidad remolque (m)"
          value={form.towCapacityM}
          onChangeText={(v) => setField('towCapacityM', v)}
          keyboardType="decimal-pad"
        />
        <RiderTextField label="Tipo de casco" value={form.hullType} onChangeText={(v) => setField('hullType', v)} />
        <RiderTextField
          label="Cantidad motores"
          value={form.motorCount}
          onChangeText={(v) => setField('motorCount', v)}
          keyboardType="number-pad"
        />
        <RiderTextField
          label="Potencia motores (HP c/u)"
          value={form.motorPowerHp}
          onChangeText={(v) => setField('motorPowerHp', v)}
          keyboardType="number-pad"
        />
        <RiderTextField label="Ámbito operativo" value={form.operatingArea} onChangeText={(v) => setField('operatingArea', v)} multiline />
        <RiderTextField label="Año" value={form.year} onChangeText={(v) => setField('year', v)} keyboardType="number-pad" />
        <RiderTextField label="Capacidad tripulación" value={form.capacity} onChangeText={(v) => setField('capacity', v)} keyboardType="number-pad" />

        <RiderPrimaryButton title="Guardar unidad" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { marginTop: SIZES.lg },
});

export default EditarUnidadAuxilioScreen;
