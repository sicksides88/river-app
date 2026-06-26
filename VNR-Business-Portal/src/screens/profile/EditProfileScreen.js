import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// EditProfileScreen - Editar perfil basado en diseño Figma
const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, updateProfile, loading } = useAuth();
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickImage = async (useCamera) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

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
        // Update user in context
        await updateProfile({});
        Alert.alert('Listo', 'Foto de perfil actualizada');
      } else {
        Alert.alert('Error', 'No se pudo subir la foto');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Cambiar foto', 'Selecciona una opción', [
      { text: 'Cámara', onPress: () => pickImage(true) },
      { text: 'Galería', onPress: () => pickImage(false) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      Alert.alert('Error', 'El nombre y apellido son requeridos');
      return;
    }

    const result = await updateProfile(formData);

    if (result.success) {
      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar el perfil');
    }
  };

  const renderInput = (label, field, options = {}) => {
    const { placeholder, keyboardType, editable = true, value } = options;
    const displayValue = value !== undefined ? value : formData[field];

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
          <TextInput
            style={[styles.input, !editable && styles.inputTextDisabled]}
            placeholder={placeholder || label}
            placeholderTextColor={COLORS.textMuted}
            value={displayValue}
            onChangeText={(text) => handleChange(field, text)}
            keyboardType={keyboardType || 'default'}
            editable={editable}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleChangePhoto}
            activeOpacity={0.8}
          >
            {uploadingPhoto ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.white} />
              </View>
            ) : user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {formData.nombre?.charAt(0) || 'U'}
                  {formData.apellido?.charAt(0) || ''}
                </Text>
              </View>
            )}
            {/* Camera Badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          {renderInput('Nombre', 'nombre', {
            placeholder: 'Tu nombre',
          })}

          {renderInput('Apellido', 'apellido', {
            placeholder: 'Tu apellido',
          })}

          {renderInput('Email', 'email', {
            placeholder: user?.email || 'email@ejemplo.com',
            value: user?.email || '',
            editable: false,
          })}
        </View>

        {/* Contact Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          {renderInput('Teléfono', 'telefono', {
            placeholder: '+54 11 1234 5678',
            keyboardType: 'phone-pad',
          })}

          {renderInput('Dirección', 'direccion', {
            placeholder: 'Tu dirección principal',
          })}
        </View>

        {/* Password Section */}
        <TouchableOpacity
          style={styles.changePasswordCard}
          onPress={() => navigation.navigate('CambiarContrasena')}
          activeOpacity={0.7}
        >
          <View style={styles.changePasswordContent}>
            <View style={styles.changePasswordIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.text} />
            </View>
            <View style={styles.changePasswordText}>
              <Text style={styles.changePasswordTitle}>Cambiar Contraseña</Text>
              <Text style={styles.changePasswordSubtitle}>Actualiza tu contraseña de acceso</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <Button
          title="Guardar Cambios"
          onPress={handleSave}
          loading={loading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SIZES.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: SIZES.h1,
    fontWeight: '700',
    color: COLORS.white,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  changePhotoText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.black,
  },

  // Form Card
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.md,
  },

  // Input Group
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  inputContainer: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    height: 48,
    justifyContent: 'center',
  },
  inputDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  input: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  inputTextDisabled: {
    color: COLORS.textMuted,
  },

  // Change Password Card
  changePasswordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  changePasswordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  changePasswordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  changePasswordText: {
    flex: 1,
  },
  changePasswordTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  changePasswordSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },

  // Bottom Container
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
    paddingBottom: SIZES.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
});

export default EditProfileScreen;
