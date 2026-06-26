import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { getRiderDisplayName, getRiderInitials } from '../../utils/riderDisplay';
import { RiderScreenShell, RiderPrimaryButton, RiderTextField } from '../../components/rider';
import api from '../../services/api';
import { COLORS, SIZES } from '../../constants/theme';

const RiderMisDatosScreen = ({ navigation }) => {
  const { user, updateProfile, refreshUser, loading } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const phone = user?.telefono?.numero || user?.telefono_numero || '';
  const countryCode = user?.telefono?.codigoPais || user?.telefono_codigo_pais || '+54';
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: phone,
    direccion: user?.direccion || '',
  });

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const uploadAvatar = async (uri) => {
    setUploadingPhoto(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const uploadResponse = await api.put('/users/avatar', { fileData: base64 });
      if (uploadResponse.data?.success) {
        await refreshUser();
        Alert.alert('Listo', 'Foto de perfil actualizada');
      } else {
        Alert.alert('Error', 'No se pudo subir la foto');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickImage = async (useCamera) => {
    try {
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', useCamera ? 'Necesitamos acceso a la cámara' : 'Necesitamos acceso a la galería');
        return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Cambiar foto', 'Seleccioná una opción', [
      { text: 'Cámara', onPress: () => pickImage(true) },
      { text: 'Galería', onPress: () => pickImage(false) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      Alert.alert('Datos incompletos', 'Nombre y apellido son obligatorios.');
      return;
    }
    const result = await updateProfile({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      direccion: form.direccion.trim(),
      telefono: {
        codigoPais: countryCode,
        numero: form.telefono.trim(),
      },
    });
    if (result.success) {
      Alert.alert('Guardado', 'Tus datos personales fueron actualizados.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'No se pudieron guardar los datos.');
    }
  };

  const initials = getRiderInitials(user);
  const displayName = getRiderDisplayName(user);

  return (
    <RiderScreenShell title="Mis datos" headerIcon="person" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarRow}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.85}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="camera" size={14} color={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.avatarMeta}>
            <Text style={styles.avatarName}>{displayName}</Text>
            <Text style={styles.avatarHint}>Patrón River Service</Text>
          </View>
        </View>

        <Text style={styles.section}>DATOS PERSONALES</Text>
        <RiderTextField label="Nombre" value={form.nombre} onChangeText={(v) => setField('nombre', v)} />
        <RiderTextField label="Apellido" value={form.apellido} onChangeText={(v) => setField('apellido', v)} />
        <RiderTextField
          label="Teléfono"
          value={form.telefono}
          onChangeText={(v) => setField('telefono', v)}
          keyboardType="phone-pad"
          placeholder={`${countryCode} ...`}
        />
        <RiderTextField
          label="Correo electrónico"
          value={user?.email || ''}
          editable={false}
        />
        <RiderTextField
          label="Dirección"
          value={form.direccion}
          onChangeText={(v) => setField('direccion', v)}
          multiline
        />

        <RiderPrimaryButton
          title="Guardar cambios"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </RiderScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.riderCard,
    borderWidth: 2,
    borderColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.riderBlue,
  },
  avatarText: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.h3 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.riderBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.riderNavy,
  },
  avatarMeta: { flex: 1 },
  avatarName: { color: COLORS.text, fontSize: SIZES.subtitle, fontWeight: '700' },
  avatarHint: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 4 },
  section: {
    color: COLORS.riderLabel,
    fontSize: SIZES.caption,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.md,
  },
  saveBtn: { marginTop: SIZES.md },
});

export default RiderMisDatosScreen;
