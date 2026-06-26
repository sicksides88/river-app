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
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import { capturePhoto } from '../../../services/media';
import { COLORS, SIZES } from '../../../constants/theme';

// Tipos de vehículo soportados (definen qué servicios puede hacer el chofer)
const VEHICLE_TYPES = [
  { value: 'moto', label: 'Moto', desc: 'Cadete y envíos rápidos', icon: 'motorbike' },
  { value: 'auto', label: 'Auto', desc: 'Vuelta Segura, Chofer y envíos', icon: 'car' },
  { value: 'camioneta', label: 'Camioneta / Furgón', desc: 'Fletes y cargas grandes', icon: 'truck' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 1990 + 1 }, (_, i) => CURRENT_YEAR + 1 - i);

const normalizePlate = (p) => (p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const isValidPlate = (p) => {
  const v = normalizePlate(p);
  return (
    /^[A-Z]{3}[0-9]{3}$/.test(v) ||         // auto viejo: AAA999
    /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(v) || // auto Mercosur: AA999AA
    /^[0-9]{3}[A-Z]{3}$/.test(v) ||         // moto vieja: 999AAA
    /^[A-Z][0-9]{3}[A-Z]{3}$/.test(v)       // moto Mercosur: A999AAA
  );
};

const AddVehicleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [vehicleType, setVehicleType] = useState(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [insurancePhoto, setInsurancePhoto] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCargo = vehicleType === 'camioneta';

  const pick = async (setter) => {
    const uri = await capturePhoto({ aspect: [16, 10] });
    if (uri) setter(uri);
  };

  const handleSave = async () => {
    if (!vehicleType) {
      Alert.alert('Falta el tipo', 'Elegí qué tipo de vehículo vas a registrar.');
      return;
    }
    if (!brand || !model || !year || !color || !plate) {
      Alert.alert('Faltan datos', 'Completá marca, modelo, año, color y patente.');
      return;
    }
    if (!isValidPlate(plate)) {
      Alert.alert('Patente inválida', 'Revisá la patente. Ej: AB123CD (auto) o A123BCD (moto).');
      return;
    }
    if (isCargo && (!capacity || parseInt(capacity, 10) <= 0)) {
      Alert.alert('Falta la capacidad', 'Indicá la capacidad de carga en kg.');
      return;
    }
    if (!frontPhoto || !backPhoto) {
      Alert.alert('Falta la cédula', 'Subí la foto de la cédula verde (frente y dorso).');
      return;
    }
    if (!insurancePhoto) {
      Alert.alert('Falta el seguro', 'Subí la foto de la póliza de seguro vigente.');
      return;
    }

    setLoading(true);
    try {
      // 1) Crear el vehículo
      const resp = await driverService.addVehicle({
        vehicleType,
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        color: color.trim(),
        plateNumber: normalizePlate(plate),
        capacity: isCargo ? parseInt(capacity, 10) : null,
      });
      const vehicleId = resp?.vehicle?.id;
      if (!resp?.success || !vehicleId) {
        throw new Error(resp?.message || 'No se pudo registrar el vehículo');
      }

      // 2) Subir los documentos atados al vehículo (quedan a revisión del admin)
      await driverService.uploadDocumentFile(frontPhoto, user.id, 'vehicle_registration_front', vehicleId);
      await driverService.uploadDocumentFile(backPhoto, user.id, 'vehicle_registration_back', vehicleId);
      await driverService.uploadDocumentFile(insurancePhoto, user.id, 'vehicle_insurance', vehicleId);

      Alert.alert(
        '¡Vehículo enviado!',
        'Tu vehículo quedó en revisión. Verificamos los documentos y te avisamos cuando esté aprobado para empezar a trabajar.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error registrando vehículo:', error);
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'No se pudo registrar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const PhotoCard = ({ label, hint, uri, onPress }) => (
    <View style={styles.photoRow}>
      <Text style={styles.photoLabel}>{label}</Text>
      <TouchableOpacity style={styles.photoBox} onPress={onPress} activeOpacity={0.8}>
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.photoImg} />
            <View style={styles.retake}>
              <Ionicons name="camera" size={18} color={COLORS.white} />
              <Text style={styles.retakeText}>Cambiar</Text>
            </View>
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={26} color={COLORS.primary} />
            <Text style={styles.photoHint}>{hint || 'Tomar / elegir foto'}</Text>
          </View>
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
        <Text style={styles.headerTitle}>Registrar vehículo</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Cargá los datos y los papeles de tu vehículo. El equipo los verifica antes de habilitarte para trabajar.
          </Text>

          {/* Tipo de vehículo */}
          <Text style={styles.sectionTitle}>Tipo de vehículo</Text>
          {VEHICLE_TYPES.map((t) => {
            const selected = vehicleType === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
                onPress={() => setVehicleType(t.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.typeIcon, selected && styles.typeIconSelected]}>
                  <MaterialCommunityIcons name={t.icon} size={26} color={selected ? COLORS.white : COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeLabel}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? COLORS.primary : COLORS.textMuted}
                />
              </TouchableOpacity>
            );
          })}

          {/* Datos del vehículo */}
          <Text style={styles.sectionTitle}>Datos del vehículo</Text>

          <Text style={styles.field}>Marca</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Ej: Toyota" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.field}>Modelo</Text>
          <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Ej: Corolla" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.field}>Año</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowYearPicker(true)} activeOpacity={0.8}>
            <Text style={[styles.selectText, year ? styles.selectTextActive : null]}>{year || 'Seleccionar año'}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <Text style={styles.field}>Color</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Ej: Gris plata" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.field}>Patente</Text>
          <TextInput
            style={[styles.input, { textTransform: 'uppercase', letterSpacing: 1 }]}
            value={plate}
            onChangeText={setPlate}
            placeholder="Ej: AB123CD"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />

          {isCargo && (
            <>
              <Text style={styles.field}>Capacidad de carga (kg)</Text>
              <TextInput
                style={styles.input}
                value={capacity}
                onChangeText={(v) => setCapacity(v.replace(/[^0-9]/g, ''))}
                placeholder="Ej: 1500"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          )}

          {/* Documentos */}
          <Text style={styles.sectionTitle}>Documentos del vehículo</Text>
          <Text style={styles.sectionHint}>Fotos claras y legibles. Quedan en revisión del equipo.</Text>
          <PhotoCard label="Cédula verde (frente)" hint="Foto del frente de la cédula" uri={frontPhoto} onPress={() => pick(setFrontPhoto)} />
          <PhotoCard label="Cédula verde (dorso)" hint="Foto del dorso de la cédula" uri={backPhoto} onPress={() => pick(setBackPhoto)} />
          <PhotoCard label="Seguro vigente" hint="Foto de la póliza vigente" uri={insurancePhoto} onPress={() => pick(setInsurancePhoto)} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + SIZES.md }]}>
        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.buttonText}>Enviar a revisión</Text>}
        </TouchableOpacity>
      </View>

      {/* Year picker */}
      <Modal visible={showYearPicker} transparent animationType="slide" onRequestClose={() => setShowYearPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar año</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={YEARS}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.yearItem, year === String(item) && styles.yearItemSelected]}
                  onPress={() => { setYear(String(item)); setShowYearPicker(false); }}
                >
                  <Text style={[styles.yearItemText, year === String(item) && styles.yearItemTextSelected]}>{item}</Text>
                  {year === String(item) && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.sm, paddingTop: SIZES.sm },
  backButton: { padding: SIZES.sm },
  headerTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.white },
  content: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 120 },
  subtitle: { fontSize: SIZES.body, color: 'rgba(255,255,255,0.72)', marginTop: SIZES.xs, marginBottom: SIZES.md, lineHeight: 22 },

  sectionTitle: { fontSize: SIZES.h4 || 16, fontWeight: '700', color: COLORS.white, marginTop: SIZES.lg, marginBottom: SIZES.sm },
  sectionHint: { fontSize: SIZES.small, color: 'rgba(255,255,255,0.6)', marginBottom: SIZES.sm, marginTop: -4 },

  // Tipo
  typeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg, padding: SIZES.md, marginBottom: SIZES.sm,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  typeCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryTint },
  typeIcon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primaryTint,
    alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md,
  },
  typeIconSelected: { backgroundColor: COLORS.primary },
  typeLabel: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.text },
  typeDesc: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },

  // Inputs
  field: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.white, marginBottom: 6, marginTop: SIZES.sm },
  input: {
    backgroundColor: COLORS.backgroundInput, borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 4, fontSize: SIZES.body, color: COLORS.text,
  },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundInput, borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm + 4,
  },
  selectText: { fontSize: SIZES.body, color: COLORS.textMuted },
  selectTextActive: { color: COLORS.text },

  // Fotos
  photoRow: { marginBottom: SIZES.md },
  photoLabel: { fontSize: SIZES.small, color: 'rgba(255,255,255,0.72)', marginBottom: 6 },
  photoBox: { height: 120, backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoHint: { marginTop: 6, fontSize: SIZES.small, color: COLORS.textSecondary },
  retake: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: SIZES.radiusFull },
  retakeText: { color: COLORS.white, fontSize: SIZES.small, fontWeight: '600' },

  // Bottom
  bottom: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.sm, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  button: { backgroundColor: COLORS.white, paddingVertical: SIZES.md + 2, borderRadius: SIZES.radiusFull, alignItems: 'center' },
  buttonText: { color: COLORS.primary, fontSize: SIZES.body, fontWeight: '700' },

  // Year modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl || 20, borderTopRightRadius: SIZES.radiusXl || 20, maxHeight: '60%', paddingBottom: SIZES.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.text },
  yearItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  yearItemSelected: { backgroundColor: COLORS.primaryTint },
  yearItemText: { fontSize: SIZES.body, color: COLORS.text },
  yearItemTextSelected: { color: COLORS.primary, fontWeight: '700' },
});

export default AddVehicleScreen;
