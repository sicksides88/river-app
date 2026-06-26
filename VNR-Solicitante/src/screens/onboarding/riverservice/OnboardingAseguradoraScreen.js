import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '../../../components/common';
import {
  OnboardingPageShell,
  FormSection,
  VesselFormField,
} from '../../../components/riverservice';
import { useOnboarding } from '../../../context/OnboardingContext';
import { membershipService } from '../../../services';
import { COLORS, SIZES } from '../../../constants/theme';
import { formatPolicyDate, formatPolicyNumber, validateAseguradoraForm } from '../../../utils/onboardingForm';
import { policyFileToBase64 } from '../../../utils/file';

const FOOTER_HINT =
  'Si elegís completar después, vas a tener que cargar los datos de la póliza al momento de solicitar el auxilio.';

const OnboardingAseguradoraScreen = ({ navigation, route }) => {
  const onboarding = useOnboarding();
  const fromProfile = route.params?.fromProfile;
  const returnTo = route.params?.returnTo;
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(fromProfile));
  const [policyFile, setPolicyFile] = useState(null);
  const [form, setForm] = useState({
    insurance_company: '',
    policy_number: '',
    expiry_date: '',
  });

  useEffect(() => {
    if (!fromProfile) return undefined;

    let active = true;
    membershipService
      .getMembership()
      .then((res) => {
        if (!active) return;
        const membership = res?.membership;
        if (!membership) return;
        setForm({
          insurance_company: membership.insurance_company || '',
          policy_number: membership.policy_number || '',
          expiry_date: membership.policy_expiry_date || '',
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setPrefillLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fromProfile]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) {
      setPolicyFile({ name: 'foto-poliza.jpg', uri: result.assets[0].uri, type: 'image' });
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPolicyFile({ name: asset.name, uri: asset.uri, type: 'pdf' });
    }
  };

  const validate = () => {
    const next = validateAseguradoraForm(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const finishFlow = async () => {
    if (fromProfile) {
      if (returnTo === 'Aseguradora') {
        navigation.replace('Aseguradora');
        return;
      }
      navigation.navigate('ProfileMain');
      return;
    }
    if (onboarding?.completeOnboarding) {
      await onboarding.completeOnboarding();
    }
  };

  const saveAndContinue = async () => {
    if (!validate()) {
      Alert.alert('Revisá los datos', 'La compañía y el nº de póliza son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const policy_file_base64 = await policyFileToBase64(policyFile);
      await membershipService.saveAseguradora({
        insurance_company: form.insurance_company.trim(),
        policy_number: form.policy_number.trim(),
        policy_expiry_date: form.expiry_date.trim() || null,
        policy_file_base64,
        policy_file_name: policyFile?.name,
        skipped: false,
      });
      await finishFlow();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudieron guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    if (fromProfile) {
      if (returnTo === 'Aseguradora') {
        navigation.goBack();
        return;
      }
      navigation.navigate('ProfileMain');
      return;
    }

    Alert.alert(
      'Completar después',
      'Vas a necesitar los datos de la póliza al solicitar auxilio.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: async () => {
          try {
            await membershipService.saveAseguradora({ skipped: true });
            await finishFlow();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'No se pudo continuar');
          }
        }},
      ]
    );
  };

  if (prefillLoading) {
    return (
      <OnboardingPageShell navigation={navigation} title="Datos de tu cobertura">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={COLORS.info} />
        </View>
      </OnboardingPageShell>
    );
  }

  return (
    <OnboardingPageShell
      navigation={navigation}
      title="Datos de tu cobertura"
      intro="Validamos tu póliza con la aseguradora. Este dato es obligatorio."
      footer={<Text style={styles.footerHint}>{FOOTER_HINT}</Text>}
    >
      <View style={styles.uploadBox}>
        <Ionicons name="camera-outline" size={28} color={COLORS.info} />
        <Text style={styles.uploadTitle}>Subir foto o PDF de tu póliza</Text>
        <Text style={styles.uploadHint}>Leemos los datos de la póliza automáticamente</Text>
        {policyFile ? (
          <Text style={styles.fileName}>{policyFile.name}</Text>
        ) : null}
        <View style={styles.uploadActions}>
          <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={18} color={COLORS.text} />
            <Text style={styles.uploadBtnText}>Tomar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickPdf}>
            <Ionicons name="document-outline" size={18} color={COLORS.text} />
            <Text style={styles.uploadBtnText}>Subir PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.divider}>o cargá los datos a mano</Text>

      <FormSection title="Datos de póliza · Obligatorio" />

      <VesselFormField
        label="Compañía aseguradora"
        value={form.insurance_company}
        onChangeText={(v) => set('insurance_company', v)}
        placeholder="Ej. Sancor Seguros"
        error={errors.insurance_company}
        autoCapitalize="words"
      />
      <VesselFormField
        label="Nº de póliza"
        value={form.policy_number}
        onChangeText={(v) => set('policy_number', formatPolicyNumber(v))}
        placeholder="POL-892341"
        error={errors.policy_number}
        autoCapitalize="characters"
        maxLength={24}
      />
      <VesselFormField
        label="Vigencia hasta"
        value={form.expiry_date}
        onChangeText={(v) => set('expiry_date', formatPolicyDate(v))}
        placeholder="DD / MM / YYYY"
        error={errors.expiry_date}
        keyboardType="number-pad"
        maxLength={14}
      />

      <Button
        title={fromProfile ? 'Guardar cambios' : 'Guardar y continuar'}
        onPress={saveAndContinue}
        loading={loading}
        style={styles.btn}
      />
      {!fromProfile || returnTo !== 'Aseguradora' ? (
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Completar después</Text>
        </TouchableOpacity>
      ) : null}
    </OnboardingPageShell>
  );
};

const styles = StyleSheet.create({
  uploadBox: {
    borderWidth: 1.5,
    borderColor: COLORS.info,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.lg,
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  uploadTitle: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  uploadHint: {
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  fileName: {
    color: COLORS.info,
    fontSize: SIZES.caption,
    marginTop: SIZES.sm,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginTop: SIZES.md,
    width: '100%',
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uploadBtnText: {
    color: COLORS.text,
    fontSize: SIZES.caption,
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    marginBottom: SIZES.lg,
  },
  btn: { marginTop: SIZES.md },
  skipBtn: { alignItems: 'center', paddingVertical: SIZES.lg },
  skipText: { color: COLORS.info, fontSize: SIZES.body, fontWeight: '600' },
  loadingBox: {
    paddingVertical: SIZES.xxl,
    alignItems: 'center',
  },
  footerHint: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    lineHeight: 18,
    marginTop: SIZES.xl,
    paddingHorizontal: SIZES.sm,
  },
});

export default OnboardingAseguradoraScreen;
