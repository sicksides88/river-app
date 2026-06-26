import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const PhotoUploader = ({ label, value, onChange, required }) => {
  const [loading, setLoading] = useState(false);

  const pick = async (useCamera) => {
    setLoading(true);
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara o galería.');
        return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onChange(asset.uri, asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } finally {
      setLoading(false);
    }
  };

  const showOptions = () => {
    Alert.alert('Foto', 'Seleccioná una opción', [
      { text: 'Cámara', onPress: () => pick(true) },
      { text: 'Galería', onPress: () => pick(false) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity style={styles.box} onPress={showOptions} disabled={loading}>
        {value ? (
          <Image source={{ uri: value }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={32} color={COLORS.primaryAccent} />
            <Text style={styles.hint}>Tomar / elegir foto</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: SIZES.md },
  label: { color: COLORS.textSecondary, fontSize: SIZES.small, marginBottom: SIZES.sm },
  box: {
    height: 140,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { color: COLORS.textMuted, marginTop: SIZES.sm, fontSize: SIZES.caption },
});

export default PhotoUploader;
