import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import driverService from '../../../services/driver.service';

const UploadVehicleDocumentScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { documentType, vehicleId, documentTitle, currentStatus } = route.params || {};

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const getDocumentInfo = () => {
    switch (documentType) {
      case 'vehicle_registration_front':
        return {
          title: 'Cédula del vehículo (Frente)',
          description: 'Sube una foto clara del frente de la cédula de tu vehículo.',
          tips: [
            'Asegúrate de que toda la información sea legible',
            'Evita reflejos y sombras',
            'La imagen debe estar bien iluminada',
          ],
        };
      case 'vehicle_registration_back':
        return {
          title: 'Cédula del vehículo (Dorso)',
          description: 'Sube una foto clara del dorso de la cédula de tu vehículo.',
          tips: [
            'Asegúrate de que toda la información sea legible',
            'Evita reflejos y sombras',
            'La imagen debe estar bien iluminada',
          ],
        };
      case 'vehicle_insurance':
        return {
          title: 'Seguro del vehículo',
          description: 'Sube una foto de la póliza de seguro vigente de tu vehículo.',
          tips: [
            'Debe mostrar la vigencia del seguro',
            'Verifica que se vea el número de póliza',
            'Incluye la cobertura del vehículo',
          ],
        };
      default:
        return {
          title: documentTitle || 'Documento',
          description: 'Sube una foto clara del documento.',
          tips: ['Asegúrate de que la imagen sea legible'],
        };
    }
  };

  const docInfo = getDocumentInfo();

  const pickImage = async (useCamera = false) => {
    try {
      let result;

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo deseas agregar la imagen?',
      [
        { text: 'Tomar foto', onPress: () => pickImage(true) },
        { text: 'Elegir de galería', onPress: () => pickImage(false) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    try {
      const response = await driverService.uploadDocumentFile(
        selectedImage,
        null, // driverId se obtiene del token
        documentType,
        vehicleId
      );

      if (response.success) {
        Alert.alert(
          'Documento subido',
          'Tu documento ha sido enviado para revisión. Será revisado en las próximas 24-48 horas.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo subir el documento');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Error al subir el documento. Intenta nuevamente.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{docInfo.title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Descripción */}
        <Text style={styles.description}>{docInfo.description}</Text>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Consejos para una buena foto:</Text>
          {docInfo.tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Área de imagen */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={showImageOptions}
          activeOpacity={0.8}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.placeholderText}>Toca para agregar imagen</Text>
              <Text style={styles.placeholderSubtext}>Tomar foto o elegir de galería</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Botón cambiar imagen si ya hay una */}
        {selectedImage && (
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={showImageOptions}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
            <Text style={styles.changeImageText}>Cambiar imagen</Text>
          </TouchableOpacity>
        )}

        {/* Estado actual */}
        {currentStatus && currentStatus !== 'missing' && (
          <View style={styles.currentStatusContainer}>
            <Ionicons
              name={currentStatus === 'approved' ? 'checkmark-circle' : currentStatus === 'rejected' ? 'close-circle' : 'time'}
              size={20}
              color={currentStatus === 'approved' ? '#34C759' : currentStatus === 'rejected' ? '#FF3B30' : '#FF9500'}
            />
            <Text style={styles.currentStatusText}>
              Estado actual: {
                currentStatus === 'approved' ? 'Aprobado' :
                currentStatus === 'rejected' ? 'Rechazado' :
                currentStatus === 'pending' ? 'Pendiente de revisión' : 'Sin subir'
              }
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Una vez subido, el documento será revisado por nuestro equipo.
            Recibirás una notificación cuando sea aprobado.
          </Text>
        </View>
      </ScrollView>

      {/* Botón principal: selecciona la imagen y, una vez elegida, la sube */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SIZES.md }]}>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.buttonDisabled]}
          onPress={selectedImage ? handleUpload : showImageOptions}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.uploadButtonText}>
              {selectedImage ? 'Subir documento' : 'Seleccionar imagen'}
            </Text>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 120,
  },
  description: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.lg,
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: '#F0FFF4',
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.xl,
  },
  tipsTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  tipText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: SIZES.md,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: SIZES.sm,
  },
  placeholderSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  changeImageText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.backgroundInput,
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.md,
  },
  currentStatusText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: SIZES.md,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
  },
  infoText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    ...SHADOWS.sm,
  },
  uploadButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default UploadVehicleDocumentScreen;
