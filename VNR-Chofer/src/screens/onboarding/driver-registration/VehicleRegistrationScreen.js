import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import { capturePhoto } from '../../../services/media';
import { COLORS, SIZES } from '../../../constants/theme';

const VehicleRegistrationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const serviceType = route.params?.serviceType || 'vuelta_segura';

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);   // cédula frente
  const [backPhoto, setBackPhoto] = useState(null);      // cédula dorso
  const [insurancePhoto, setInsurancePhoto] = useState(null); // seguro
  const [loading, setLoading] = useState(false);

  const pick = async (setter) => {
    const uri = await capturePhoto({ aspect: [16, 10] });
    if (uri) setter(uri);
  };

  const handleContinue = async () => {
    if (!brand || !model || !year || !plate) {
      Alert.alert('Faltan datos', 'Completá marca, modelo, año y patente.');
      return;
    }
    if (!frontPhoto || !backPhoto) {
      Alert.alert('Falta la cédula', 'Subí la foto de la cédula del vehículo (frente y dorso).');
      return;
    }
    if (!insurancePhoto) {
      Alert.alert('Falta el seguro', 'Subí la foto del seguro del vehículo.');
      return;
    }

    setLoading(true);
    try {
      // 1) Crear el vehículo
      const resp = await driverService.addVehicle({
        brand,
        model,
        year: parseInt(year, 10),
        plateNumber: plate.toUpperCase(),
        color: color || null,
        vehicleType: serviceType === 'fletes' ? 'furgon' : 'sedan',
      });
      const vehicleId = resp?.vehicle?.id;
      if (!resp?.success || !vehicleId) {
        throw new Error(resp?.message || 'No se pudo registrar el vehículo');
      }

      // 2) Subir los documentos del vehículo (atados al vehículo)
      await driverService.uploadDocumentFile(frontPhoto, user.id, 'vehicle_registration_front', vehicleId);
      await driverService.uploadDocumentFile(backPhoto, user.id, 'vehicle_registration_back', vehicleId);
      await driverService.uploadDocumentFile(insurancePhoto, user.id, 'vehicle_insurance', vehicleId);

      // 3) Último paso del alta: disponibilidad
      navigation.navigate('DriverSchedule', { serviceType, isOnboarding: true });
    } catch (error) {
      console.error('Error registrando vehículo:', error);
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'No se pudo continuar');
    } finally {
      setLoading(false);
    }
  };

  const PhotoRow = ({ label, uri, onPress }) => (
    <View style={styles.photoRow}>
      <Text style={styles.photoLabel}>{label}</Text>
      <TouchableOpacity style={styles.photoBox} onPress={onPress} activeOpacity={0.7}>
        {uri ? (
          <Image source={{ uri }} style={styles.photoImg} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={26} color={COLORS.textMuted} />
            <Text style={styles.photoHint}>Tomar / elegir foto</Text>
          </View>
        )}
        {uri && (
          <View style={styles.retake}><Ionicons name="camera" size={20} color={COLORS.white} /></View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Registrá tu vehículo</Text>
          <Text style={styles.subtitle}>
            Necesitamos los datos y los papeles de tu vehículo para verificarlo antes de que puedas trabajar.
          </Text>

          <Text style={styles.field}>Marca</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Ej: Toyota" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.field}>Modelo</Text>
          <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Ej: Corolla" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.field}>Año</Text>
          <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="Ej: 2018" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" maxLength={4} />

          <Text style={styles.field}>Patente</Text>
          <TextInput style={[styles.input, { textTransform: 'uppercase' }]} value={plate} onChangeText={setPlate} placeholder="Ej: AB123CD" placeholderTextColor={COLORS.textMuted} autoCapitalize="characters" />

          <Text style={styles.field}>Color (opcional)</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Ej: Gris" placeholderTextColor={COLORS.textMuted} />

          <Text style={[styles.sectionTitle]}>Documentos del vehículo</Text>
          <PhotoRow label="Cédula (frente)" uri={frontPhoto} onPress={() => pick(setFrontPhoto)} />
          <PhotoRow label="Cédula (dorso)" uri={backPhoto} onPress={() => pick(setBackPhoto)} />
          <PhotoRow label="Seguro del vehículo" uri={insurancePhoto} onPress={() => pick(setInsurancePhoto)} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + SIZES.md }]}>
        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Continuar</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.sm, paddingTop: SIZES.sm },
  backButton: { padding: SIZES.sm },
  content: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.white, marginBottom: SIZES.sm, lineHeight: 32 },
  subtitle: { fontSize: SIZES.body, color: 'rgba(255,255,255,0.72)', marginBottom: SIZES.lg, lineHeight: 22 },
  field: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.white, marginBottom: 6, marginTop: SIZES.sm },
  input: {
    backgroundColor: COLORS.backgroundInput, borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 4, fontSize: SIZES.body, color: COLORS.text,
  },
  sectionTitle: { fontSize: SIZES.h4 || 16, fontWeight: '700', color: COLORS.white, marginTop: SIZES.lg, marginBottom: SIZES.sm },
  photoRow: { marginBottom: SIZES.md },
  photoLabel: { fontSize: SIZES.small, color: 'rgba(255,255,255,0.72)', marginBottom: 6 },
  photoBox: { height: 110, backgroundColor: COLORS.backgroundInput, borderRadius: SIZES.radiusLg, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoHint: { marginTop: 6, fontSize: SIZES.small, color: COLORS.textMuted },
  retake: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.sm, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  button: { backgroundColor: COLORS.white, paddingVertical: SIZES.md + 2, borderRadius: SIZES.radiusFull, alignItems: 'center' },
  buttonText: { color: COLORS.primary, fontSize: SIZES.body, fontWeight: '600' },
});

export default VehicleRegistrationScreen;
