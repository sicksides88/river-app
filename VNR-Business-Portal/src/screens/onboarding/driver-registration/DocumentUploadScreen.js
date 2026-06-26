import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import { COLORS, SIZES } from '../../../constants/theme';

const DOC_CONFIG = {
  buena_conducta: {
    title: 'Certificado de buena conducta',
    subtitle: 'Subí una foto o PDF de tu certificado de buena conducta vigente.',
    icon: 'shield-checkmark-outline',
  },
  seguro_accidentes: {
    title: 'Seguro de accidentes personales',
    subtitle: 'Subí una foto o PDF de tu póliza de seguro de accidentes personales vigente.',
    icon: 'medkit-outline',
  },
};

const DocumentUploadScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const docType = route.params?.docType || 'buena_conducta';
  const serviceType = route.params?.serviceType || 'vuelta_segura';
  const config = DOC_CONFIG[docType] || DOC_CONFIG.buena_conducta;

  const [document, setDocument] = useState(null); // { uri, name, type }
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar la foto');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          name: `${docType}.jpg`,
          type: 'image',
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          name: `${docType}.jpg`,
          type: 'image',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setDocument({
          uri: asset.uri,
          name: asset.name || `${docType}.pdf`,
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'image',
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpload = async () => {
    if (!document) {
      Alert.alert('Atención', 'Primero seleccioná o sacá una foto del documento');
      return;
    }

    setLoading(true);
    try {
      await driverService.uploadDocumentFile(document.uri, user.id, docType);
      navigation.navigate('DriverRegistrationSteps', { completedStep: docType, serviceType });
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'No se pudo subir el documento. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Subir documento',
      'Elegí cómo querés subir el documento',
      [
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Elegir de galería', onPress: pickFromGallery },
        { text: 'Seleccionar archivo', onPress: pickDocument },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        {/* Upload area */}
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={showUploadOptions}
          activeOpacity={0.7}
        >
          {document ? (
            document.type === 'image' ? (
              <Image source={{ uri: document.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.pdfPreview}>
                <Ionicons name="document-text" size={48} color={COLORS.primary || '#3b82f6'} />
                <Text style={styles.pdfName} numberOfLines={1}>{document.name}</Text>
              </View>
            )
          ) : (
            <View style={styles.placeholderContent}>
              <View style={styles.iconCircle}>
                <Ionicons name={config.icon} size={40} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.uploadText}>Tocá para subir el documento</Text>
              <Text style={styles.uploadHint}>Foto o PDF</Text>
            </View>
          )}
          {document && (
            <View style={styles.retakeOverlay}>
              <Ionicons name="camera" size={28} color={COLORS.white} />
              <Text style={styles.retakeText}>Cambiar</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Asegurate de que el documento sea legible y esté vigente. Se verificará antes de aprobar tu registro.
        </Text>
      </View>

      {/* Bottom button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, !document && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={loading || !document}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>
              {document ? 'Subir documento' : 'Seleccioná un documento'}
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
    color: COLORS.text,
    marginBottom: SIZES.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  uploadArea: {
    height: 220,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SIZES.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pdfPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    maxWidth: '80%',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  uploadHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
    gap: 4,
  },
  retakeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomContainer: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  button: {
    backgroundColor: COLORS.text,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default DocumentUploadScreen;
