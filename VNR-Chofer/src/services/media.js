import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { Alert } from 'react-native';

// Captura una imagen. En dispositivos reales abre la CÁMARA; en simulador/emulador
// (que no tienen cámara) o si la cámara no está disponible, cae automáticamente a
// elegir una foto de la GALERÍA. Devuelve el uri o null.
export async function capturePhoto(options = {}) {
  const pickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    ...options,
  };

  const openLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para continuar.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    return !result.canceled && result.assets?.[0] ? result.assets[0].uri : null;
  };

  // Simulador / emulador: no hay cámara → galería directamente.
  if (Device.isDevice === false) {
    return openLibrary();
  }

  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar la foto.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    return !result.canceled && result.assets?.[0] ? result.assets[0].uri : null;
  } catch (e) {
    // Cámara no disponible (p. ej. simulador): caer a galería.
    console.log('Cámara no disponible, usando galería:', e?.message);
    return openLibrary();
  }
}
