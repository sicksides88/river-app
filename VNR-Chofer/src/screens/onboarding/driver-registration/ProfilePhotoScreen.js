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
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import { capturePhoto } from '../../../services/media';
import { COLORS, SIZES } from '../../../constants/theme';

const ProfilePhotoScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const serviceType = route.params?.serviceType || 'vuelta_segura';
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const uri = await capturePhoto({ aspect: [1, 1] });
    if (uri) setPhoto(uri);
  };

  const handleContinue = async () => {
    if (!photo) {
      takePhoto();
      return;
    }

    setLoading(true);
    try {
      // Subir foto de perfil/selfie al servidor
      await driverService.uploadDocumentFile(photo, user.id, 'selfie_verification');

      // Volver a la pantalla de pasos marcando este como completado
      navigation.navigate('DriverRegistrationSteps', { completedStep: 'profile_photo', serviceType });
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    'Mostrá tu rostro completo, mirando a la cámara.',
    'Usá un fondo claro y sin objetos que distraigan.',
    'Asegurate de que haya buena iluminación, preferentemente natural.',
    'Que la foto esté nítida y legible, sin sombras ni borrosidad.',
  ];

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
        <Text style={styles.title}>Tomá una foto para tu perfil</Text>
        <Text style={styles.subtitle}>
          La foto de perfil debe ser clara y debe permitir identificar al conductor.
        </Text>

        {/* Avatar placeholder o foto tomada */}
        <View style={styles.avatarContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color={COLORS.textMuted} />
            </View>
          )}
          {photo && (
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de requisitos */}
        <View style={styles.requirementsList}>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Boton Tomar foto / Continuar */}
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
            <Text style={styles.buttonText}>
              {photo ? 'Continuar' : 'Tomar foto'}
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementsList: {
    gap: SIZES.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginRight: SIZES.sm,
    lineHeight: 22,
  },
  requirementText: {
    flex: 1,
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

export default ProfilePhotoScreen;
