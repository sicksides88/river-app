import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Button } from '../../../components/common';
import {
  OnboardingPageShell,
  FormSection,
  VesselFormField,
  FormSelectField,
} from '../../../components/riverservice';
import { useOnboarding } from '../../../context/OnboardingContext';
import { membershipService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, SIZES } from '../../../constants/theme';
import {
  formatCuilCuit,
  formatCbu,
  ACCOUNT_TYPE_OPTIONS,
  DEFAULT_ACCOUNT_TYPE,
  BILLING_PREFERENCE_OPTIONS,
  DEFAULT_BILLING_PREFERENCE,
  validateIndependienteForm,
  buildIndependientePayload,
} from '../../../utils/onboardingForm';

const OnboardingIndependienteScreen = ({ navigation, route }) => {
  const onboarding = useOnboarding();
  const fromProfile = route.params?.fromProfile;
  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    account_holder: user?.nombre
      ? `${user.nombre} ${user.apellido || ''}`.trim()
      : '',
    account_type: DEFAULT_ACCOUNT_TYPE,
    cuil_cuit: user?.cuit_cuil ? formatCuilCuit(user.cuit_cuil) : '',
    cbu: '',
    bank_name: '',
    billing_preference: DEFAULT_BILLING_PREFERENCE,
  });

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const finishFlow = async () => {
    if (fromProfile) {
      navigation.navigate('ProfileMain');
      return;
    }
    if (onboarding?.completeOnboarding) {
      await onboarding.completeOnboarding();
    }
  };

  const saveAndContinue = async () => {
    const validationErrors = validateIndependienteForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Revisá los datos', 'Hay campos incompletos o con formato incorrecto.');
      return;
    }

    setLoading(true);
    try {
      await membershipService.saveIndependiente(buildIndependientePayload(form));
      await finishFlow();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudieron guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    if (fromProfile) {
      navigation.navigate('ProfileMain');
      return;
    }

    Alert.alert(
      'Completar después',
      'Podés cargar tus datos bancarios más tarde desde tu perfil.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            try {
              await membershipService.saveIndependiente({ skipped: true });
              await finishFlow();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'No se pudo continuar');
            }
          },
        },
      ]
    );
  };

  return (
    <OnboardingPageShell
      navigation={navigation}
      title="Datos de socio independiente"
      intro="Usamos estos datos para el débito de tu cuota mensual."
    >
      <FormSection title="Titular" />

      <VesselFormField
        label="Titular de la cuenta"
        value={form.account_holder}
        onChangeText={(v) => set('account_holder', v)}
        placeholder="Ej. Javier Ureta"
        error={errors.account_holder}
        autoCapitalize="words"
      />

      <FormSelectField
        label="Tipo de cuenta"
        value={form.account_type}
        options={ACCOUNT_TYPE_OPTIONS}
        onChange={(v) => set('account_type', v)}
        error={errors.account_type}
      />

      <VesselFormField
        label="CUIL / CUIT del titular"
        value={form.cuil_cuit}
        onChangeText={(v) => set('cuil_cuit', formatCuilCuit(v))}
        placeholder="20-32812448-7"
        error={errors.cuil_cuit}
        keyboardType="number-pad"
        maxLength={13}
      />

      <FormSection title="Banco" />

      <VesselFormField
        label="CBU"
        value={form.cbu}
        onChangeText={(v) => set('cbu', formatCbu(v))}
        placeholder="0170 0123 4567 8901 2345 67"
        error={errors.cbu}
        keyboardType="number-pad"
      />

      <VesselFormField
        label="Nombre del banco"
        value={form.bank_name}
        onChangeText={(v) => set('bank_name', v)}
        placeholder="Ej. Banco Galicia"
        error={errors.bank_name}
        autoCapitalize="words"
      />

      <FormSelectField
        label="Preferencia de vencimiento"
        value={form.billing_preference}
        options={BILLING_PREFERENCE_OPTIONS}
        onChange={(v) => set('billing_preference', v)}
        error={errors.billing_preference}
      />

      <Button
        title={fromProfile ? 'Guardar cambios' : 'Guardar y continuar'}
        onPress={saveAndContinue}
        loading={loading}
        style={styles.btn}
      />
      {!fromProfile ? (
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Completar después</Text>
        </TouchableOpacity>
      ) : null}
    </OnboardingPageShell>
  );
};

const styles = StyleSheet.create({
  btn: { marginTop: SIZES.lg },
  skipBtn: { alignItems: 'center', paddingVertical: SIZES.lg },
  skipText: { color: COLORS.primaryAccent, fontSize: SIZES.body, fontWeight: '600' },
});

export default OnboardingIndependienteScreen;
