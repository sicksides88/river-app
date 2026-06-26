import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import { COLORS, SIZES } from '../../../constants/theme';

const VehicleRegistrationScreen = ({ navigation, route }) => {
  const { updateProfile, user } = useAuth();
  const serviceType = route.params?.serviceType || 'vuelta_segura';
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async (side) => {
    try {
      // Pedir permisos de camara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar la foto');
        return;
      }

      // Abrir camara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (side === 'front') {
          setFrontPhoto(result.assets[0].uri);
        } else {
          setBackPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleContinue = async () => {
    // Si no hay fotos, tomar la primera
    if (!frontPhoto) {
      takePhoto('front');
      return;
    }
    if (!backPhoto) {
      takePhoto('back');
      return;
    }

    setLoading(true);
    try {
      // Subir foto de cédula del vehículo (frente)
      await driverService.uploadDocumentFile(frontPhoto, user.id, 'vehicle_registration_front');

      // Subir foto de cédula del vehículo (dorso)
      await driverService.uploadDocumentFile(backPhoto, user.id, 'vehicle_registration_back');

      // Marcar onboarding como completado y guardar el servicio seleccionado
      await updateProfile({
        onboarding_completed: true,
        selected_services: [serviceType],
      });

      // El AppNavigator detectara el cambio y navegara al Home
    } catch (error) {
      console.error('Error completing registration:', error);
      Alert.alert('Error', error.message || 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (!frontPhoto && !backPhoto) return 'Tomar foto';
    if (frontPhoto && !backPhoto) return 'Tomar foto del dorso';
    return 'Finalizar registro';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con boton back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Titulo */}
        <Text style={styles.title}>Tomá una foto de tu Cédula del Vehículo</Text>
        <Text style={styles.subtitle}>
          Mostrá <Text style={styles.bold}>frente y dorso</Text>, con buena iluminación y sin reflejos.
        </Text>

        {/* Placeholders de fotos */}
        <View style={styles.photosContainer}>
          {/* Frente */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Frente</Text>
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => takePhoto('front')}
              activeOpacity={0.7}
            >
              {frontPhoto ? (
                <Image source={{ uri: frontPhoto }} style={styles.photoImage} />
              ) : (
                <View style={styles.placeholderContent}>
                  <View style={styles.placeholderCard}>
                    <View style={styles.placeholderLine} />
                    <View style={styles.placeholderLine} />
                    <View style={styles.placeholderLine} />
                    <View style={styles.placeholderCircle} />
                  </View>
                </View>
              )}
              {frontPhoto && (
                <View style={styles.retakeOverlay}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Dorso */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Dorso</Text>
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={() => takePhoto('back')}
              activeOpacity={0.7}
            >
              {backPhoto ? (
                <Image source={{ uri: backPhoto }} style={styles.photoImage} />
              ) : (
                <View style={styles.placeholderContent}>
                  <View style={styles.placeholderCard}>
                    <View style={styles.placeholderLineShort} />
                    <View style={styles.placeholderLine} />
                    <View style={[styles.placeholderCircle, styles.placeholderCircleLarge]} />
                  </View>
                </View>
              )}
              {backPhoto && (
                <View style={styles.retakeOverlay}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Nota */}
        <Text style={styles.note}>
          Asegurate de capturar ambos lados y que podamos leer todos los detalles fácilmente.
        </Text>
      </View>

      {/* Boton */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>{getButtonText()}</Text>
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
  backButton: {
    padding: SIZES.md,
    marginLeft: SIZES.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.white,
  },
  photosContainer: {
    gap: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoLabel: {
    width: 60,
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
  },
  photoPlaceholder: {
    flex: 1,
    height: 100,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
  },
  placeholderCard: {
    width: '80%',
    height: '80%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.sm,
    justifyContent: 'center',
    gap: 6,
  },
  placeholderLine: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    width: '100%',
  },
  placeholderLineShort: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    width: '60%',
  },
  placeholderCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-end',
  },
  placeholderCircleLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  retakeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
  },
  bottomContainer: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default VehicleRegistrationScreen;
