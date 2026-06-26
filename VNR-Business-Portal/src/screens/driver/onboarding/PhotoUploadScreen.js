import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import { COLORS, SIZES } from '../../../constants/theme';

const photoConfigs = {
  profile: {
    title: 'Tomá una foto para tu perfil',
    subtitle: 'La foto de perfil debe ser clara y debe permitir identificar al conductor.',
    instructions: [
      'Mostrá tu rostro completo, mirando a la cámara.',
      'Usá un fondo claro y sin objetos que distraigan.',
      'Asegurate de que haya buena iluminación, preferentemente natural.',
      'Que la foto esté nítida y legible, sin sombras ni borrosidad.',
    ],
    showFrontBack: false,
    icon: 'person-circle-outline',
  },
  license: {
    title: 'Tomá una foto de tu Licencia de conducir',
    subtitle: 'Mostrá frente y dorso, con buena iluminación y sin reflejos.',
    instructions: [
      'Asegurate de capturar ambos lados y que podamos leer todos los detalles fácilmente.',
    ],
    showFrontBack: true,
    icon: 'card-outline',
  },
  vehicle: {
    title: 'Tomá una foto de tu Cédula del Vehículo',
    subtitle: 'Mostrá frente y dorso, con buena iluminación y sin reflejos.',
    instructions: [
      'Asegurate de capturar ambos lados y que podamos leer todos los detalles fácilmente.',
    ],
    showFrontBack: true,
    icon: 'document-outline',
  },
};

const PhotoUploadScreen = ({ navigation, route }) => {
  const { type, serviceType } = route.params || {};
  const { user, refreshUser } = useAuth();
  const config = photoConfigs[type] || photoConfigs.profile;

  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Mapeo de tipos a document_type del backend
  const documentTypeMap = {
    profile: 'selfie_verification',
    license: { front: 'license_front', back: 'license_back' },
    vehicle: { front: 'vehicle_registration', back: 'vehicle_registration' },
  };

  const handleTakePhoto = async (side = null) => {
    try {
      // Pedir permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a la cámara para tomar fotos.');
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: config.showFrontBack ? [4, 3] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;

        if (config.showFrontBack) {
          if (side === 'front') {
            setFrontPhoto(photoUri);
          } else {
            setBackPhoto(photoUri);
          }
        } else {
          setProfilePhoto(photoUri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta nuevamente.');
    }
  };

  const uploadAndSaveDocument = async (uri, docType) => {
    try {
      // Subir documento via API (el backend sube a Storage y guarda en BD)
      await driverService.uploadDocumentFile(uri, user.id, docType);
      return true;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleComplete = async () => {
    setUploading(true);
    try {
      // Subir documentos según el tipo
      if (type === 'profile' && profilePhoto) {
        await uploadAndSaveDocument(profilePhoto, documentTypeMap.profile);
        // Refrescar datos del usuario para actualizar el avatar en toda la app
        await refreshUser();
      } else if (type === 'license') {
        if (frontPhoto) {
          await uploadAndSaveDocument(frontPhoto, documentTypeMap.license.front);
        }
        if (backPhoto) {
          await uploadAndSaveDocument(backPhoto, documentTypeMap.license.back);
        }
      } else if (type === 'vehicle') {
        if (frontPhoto) {
          await uploadAndSaveDocument(frontPhoto, 'vehicle_registration');
        }
      }

      // Determinar siguiente pantalla
      // Detectar si estamos en el flujo de DriverHomeStack (DriverDocuments) o DriverOnboardingStack (PhotoUpload)
      const isFromHomeStack = navigation.getState()?.routes?.some(r => r.name === 'DriverDocuments');
      const nextScreen = isFromHomeStack ? 'DriverDocuments' : 'PhotoUpload';

      const nextScreenMap = {
        profile: { screen: nextScreen, params: { type: 'license', serviceType } },
        license: { screen: nextScreen, params: { type: 'vehicle', serviceType } },
        vehicle: null,
      };

      const next = nextScreenMap[type];

      if (type === 'vehicle') {
        Alert.alert(
          'Documentos enviados',
          'Tus documentos han sido enviados para revisión. Te notificaremos cuando sean aprobados.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Si venimos de DriverHomeStack, volver atrás; si no, ir a DriverMain
                if (isFromHomeStack) {
                  navigation.goBack();
                } else {
                  navigation.navigate('DriverMain');
                }
              },
            },
          ]
        );
      } else {
        navigation.navigate(next.screen, next.params);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron subir los documentos. Intenta nuevamente.'
      );
    } finally {
      setUploading(false);
    }
  };

  const canContinue = config.showFrontBack
    ? (frontPhoto && backPhoto)
    : profilePhoto;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        {/* Photo placeholder(s) */}
        {config.showFrontBack ? (
          <View style={styles.photosContainer}>
            {/* Front */}
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => handleTakePhoto('front')}
              activeOpacity={0.7}
            >
              {frontPhoto ? (
                <View style={styles.photoTakenContainer}>
                  <Image source={{ uri: frontPhoto }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <Ionicons name="checkmark-circle" size={30} color={COLORS.success} />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.photoLabel}>Frente</Text>
                  <View style={styles.documentPreview}>
                    <View style={styles.documentLines}>
                      <View style={styles.documentLine} />
                      <View style={styles.documentLine} />
                      <View style={styles.documentLine} />
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Back */}
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => handleTakePhoto('back')}
              activeOpacity={0.7}
            >
              {backPhoto ? (
                <View style={styles.photoTakenContainer}>
                  <Image source={{ uri: backPhoto }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <Ionicons name="checkmark-circle" size={30} color={COLORS.success} />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.photoLabel}>Dorso</Text>
                  <View style={styles.documentPreview}>
                    <View style={styles.documentLines}>
                      <View style={styles.documentLine} />
                      <View style={styles.documentLine} />
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.profilePhotoContainer}
            onPress={() => handleTakePhoto()}
            activeOpacity={0.7}
          >
            <View style={styles.profilePhotoPlaceholder}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profilePhotoImage} />
              ) : (
                <Ionicons name="person" size={60} color={COLORS.textMuted} />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          {config.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom button */}
      <View style={styles.bottomContainer}>
        {!canContinue ? (
          <TouchableOpacity
            style={styles.takePhotoButton}
            onPress={() => handleTakePhoto(config.showFrontBack ? 'front' : null)}
            activeOpacity={0.8}
          >
            <Text style={styles.takePhotoButtonText}>Tomar foto</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.takePhotoButton, uploading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.takePhotoButtonText}>
                {type === 'vehicle' ? 'Enviar documentos' : 'Continuar'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  photosContainer: {
    gap: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: SIZES.sm,
  },
  documentPreview: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    justifyContent: 'center',
  },
  documentLines: {
    gap: SIZES.sm,
  },
  documentLine: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    width: '70%',
  },
  photoTakenContainer: {
    width: '100%',
    height: 100,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: SIZES.xs,
    right: SIZES.xs,
    backgroundColor: COLORS.white,
    borderRadius: 15,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  instructionsContainer: {
    gap: SIZES.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionBullet: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginRight: SIZES.xs,
  },
  instructionText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomContainer: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
    gap: SIZES.sm,
  },
  takePhotoButton: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  takePhotoButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.backgroundInput,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  continueButtonText: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default PhotoUploadScreen;
