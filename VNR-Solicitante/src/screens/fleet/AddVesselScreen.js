import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common';
import { TopBar, VesselFormField, VesselTypePicker, FormSection } from '../../components/riverservice';
import { vesselService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import {
  formatRegistrationInput,
  isRegistrationComplete,
  validateVesselForm,
  buildVesselPayload,
  getRegistrationExample,
  getRegistrationMaxLength,
  vesselToForm,
} from '../../utils/vesselForm';

const COVERAGE_HINT =
  'Zona de cobertura: Rosario · Santa Fe · Paraná · Concepción del Uruguay.';

const AddVesselScreen = ({ navigation, route }) => {
  const onSaved = route.params?.onSaved;
  const onSkip = route.params?.onSkip;
  const isOnboarding = route.params?.isOnboarding ?? Boolean(onSaved);
  const isEdit = route.params?.mode === 'edit';
  const editingVessel = route.params?.vessel;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => vesselToForm(editingVessel) || {
    name: '',
    registration: '',
    color: '',
    type: 'Motor',
    length_m: '',
    beam_m: '',
    draft_m: '',
    depth_m: '',
    engine_count: '',
    engine_power_hp: '',
    marina: '',
    geographic_area: '',
  });

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleRegistrationChange = (text) => {
    set('registration', formatRegistrationInput(text));
  };

  const save = async () => {
    const validationErrors = validateVesselForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Revisá los datos', 'Hay campos incompletos o con formato incorrecto.');
      return;
    }

    setLoading(true);
    try {
      const payload = buildVesselPayload(form);
      const res = isEdit && editingVessel?.id
        ? await vesselService.updateVessel(editingVessel.id, payload)
        : await vesselService.createVessel(payload);
      if (res.success) {
        if (!isEdit) {
          await vesselService.setActiveVesselId(res.vessel.id);
        }
        if (onSaved) {
          onSaved();
        } else {
          navigation.goBack();
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la embarcación');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    Alert.alert(
      'Agregar después',
      'Podés cargar tu embarcación más tarde desde la pestaña Flota. Sin embarcación no podremos enviarte auxilio.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            if (onSkip) {
              onSkip();
            } else {
              navigation.navigate('OnboardingLinkType');
            }
          },
        },
      ]
    );
  };

  const registrationComplete = isRegistrationComplete(form.registration);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopBar
        title={isEdit ? 'Editar embarcación' : 'Cargá tu embarcación'}
        subtitle={
          isEdit
            ? 'Actualizá los datos de tu embarcación.'
            : 'Sin embarcación cargada no podemos enviarte auxilio.'
        }
        onBack={isOnboarding ? undefined : () => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormSection title="Identificación" />

          <VesselFormField
            label="Nombre de la embarcación"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="Ej. Crucero El Resplandor"
            error={errors.name}
            autoCapitalize="words"
          />

          <VesselFormField
            label="Matrícula"
            value={form.registration}
            onChangeText={handleRegistrationChange}
            placeholder={`Ej. ${getRegistrationExample()}`}
            error={errors.registration}
            autoCapitalize="characters"
            maxLength={getRegistrationMaxLength()}
            highlightValue={registrationComplete}
          />

          <VesselFormField
            label="Color"
            value={form.color}
            onChangeText={(v) => set('color', v)}
            placeholder="Ej. Blanco / Azul"
            error={errors.color}
          />

          <VesselTypePicker
            value={form.type}
            onChange={(v) => set('type', v)}
            error={errors.type}
          />

          <FormSection title="Dimensiones" />

          <View style={styles.row}>
            <VesselFormField
              label="Eslora (m)"
              value={form.length_m}
              onChangeText={(v) => set('length_m', v.replace(/[^0-9.,]/g, ''))}
              placeholder="8.5"
              keyboardType="decimal-pad"
              error={errors.length_m}
              containerStyle={styles.half}
            />
            <VesselFormField
              label="Manga (m)"
              value={form.beam_m}
              onChangeText={(v) => set('beam_m', v.replace(/[^0-9.,]/g, ''))}
              placeholder="2.6"
              keyboardType="decimal-pad"
              error={errors.beam_m}
              containerStyle={styles.half}
            />
          </View>

          <View style={styles.row}>
            <VesselFormField
              label="Calado (m)"
              value={form.draft_m}
              onChangeText={(v) => set('draft_m', v.replace(/[^0-9.,]/g, ''))}
              placeholder="0.8"
              keyboardType="decimal-pad"
              error={errors.draft_m}
              containerStyle={styles.half}
            />
            <VesselFormField
              label="Puntal (m)"
              value={form.depth_m}
              onChangeText={(v) => set('depth_m', v.replace(/[^0-9.,]/g, ''))}
              placeholder="1.4"
              keyboardType="decimal-pad"
              error={errors.depth_m}
              containerStyle={styles.half}
            />
          </View>

          <FormSection title="Motores" />

          <View style={styles.row}>
            <VesselFormField
              label="Cantidad de motores"
              value={form.engine_count}
              onChangeText={(v) => set('engine_count', v.replace(/\D/g, ''))}
              placeholder="2"
              keyboardType="number-pad"
              error={errors.engine_count}
              containerStyle={styles.half}
            />
            <VesselFormField
              label="Potencia total (HP)"
              value={form.engine_power_hp}
              onChangeText={(v) => set('engine_power_hp', v.replace(/\D/g, ''))}
              placeholder="450"
              keyboardType="number-pad"
              error={errors.engine_power_hp}
              containerStyle={styles.half}
            />
          </View>

          <FormSection title="Ubicación" />

          <VesselFormField
            label="Guardería / Club / Barrio"
            value={form.marina}
            onChangeText={(v) => set('marina', v)}
            placeholder="Ej. Club Náutico Rosario"
            error={errors.marina}
            autoCapitalize="words"
          />

          <VesselFormField
            label="Ámbito geográfico"
            value={form.geographic_area}
            onChangeText={(v) => set('geographic_area', v)}
            placeholder="Ej. Rosario · Río Paraná"
            error={errors.geographic_area}
            autoCapitalize="words"
          />

          <Text style={styles.hint}>{COVERAGE_HINT}</Text>

          <Button title="Guardar embarcación" onPress={save} loading={loading} style={styles.btn} />

          {isOnboarding ? (
            <TouchableOpacity onPress={skip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Agregar después</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  row: { flexDirection: 'row', gap: SIZES.sm },
  half: { flex: 1 },
  hint: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SIZES.lg,
  },
  btn: { marginTop: SIZES.sm },
  skipBtn: { alignItems: 'center', paddingVertical: SIZES.lg },
  skipText: { color: COLORS.primaryAccent, fontSize: SIZES.body, fontWeight: '600' },
});

export default AddVesselScreen;
