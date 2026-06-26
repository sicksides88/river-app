import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext';
import { driverService } from '../../../services';
import api from '../../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';

// Servicios que requieren modo conductor
const DRIVER_SERVICES = ['vuelta_segura', 'fletes', 'cadete', 'chofer'];

const DriverMenuScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  const [driverType, setDriverType] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const fetchDriverType = async () => {
      try {
        const response = await driverService.getDriverStatus();
        if (response.success && response.isDriver) {
          setDriverType(response.driverType);
        }
      } catch (error) {
        console.log('Error fetching driver type:', error);
      }
    };
    fetchDriverType();
  }, []);

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

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  // Secciones del menú como en Figma
  const adminItems = [
    {
      id: 'marketplace',
      title: 'Tienda',
      icon: 'storefront-outline',
      onPress: () => navigation.navigate('Marketplace'),
    },
    {
      id: 'vehicles',
      title: 'Vehículos',
      icon: 'car-outline',
      onPress: () => navigation.navigate('Vehicles'),
    },
    {
      id: 'documents',
      title: 'Documentos',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('Documents'),
    },
    {
      id: 'schedule',
      title: 'Disponibilidad',
      icon: 'calendar-outline',
      onPress: () => navigation.navigate('DriverSchedule', { isOnboarding: false }),
    },
    {
      id: 'seguro',
      title: 'Seguro',
      icon: 'shield-checkmark-outline',
      onPress: () => {},
    },
  ];

  const moneyItems = [
    {
      id: 'payment',
      title: 'Método de pago',
      icon: 'card-outline',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      id: 'mercadopago',
      title: 'Conectar MercadoPago',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('MercadoPagoConnect'),
    },
  ];

  const resourceItems = [
    {
      id: 'about',
      title: 'Acerca de',
      icon: 'information-circle-outline',
      onPress: () => {},
    },
    {
      id: 'logout',
      title: 'Cerrar sesión',
      icon: 'log-out-outline',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon}
        size={22}
        color={item.isDestructive ? (COLORS.error || '#DC2626') : COLORS.white}
      />
      <Text style={[
        styles.menuItemText,
        item.isDestructive && styles.menuItemTextDestructive
      ]}>
        {item.title}
      </Text>
      {!item.isDestructive && (
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.55)" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleChangePhoto}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={COLORS.textMuted} />
              ) : user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={32} color={COLORS.textMuted} />
              )}
            </View>
            {/* Edit badge */}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {/* Name and rating */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.nombre || ''} {user?.apellido || ''}
            </Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>
                {user?.rating_average ? parseFloat(user.rating_average).toFixed(1) : '5.0'}
              </Text>
              <Ionicons name="star" size={14} color="#FFB800" />
            </View>
          </View>
        </View>

        {/* Administrar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administrar</Text>
          {adminItems.map(renderMenuItem)}
        </View>

        {/* Dinero */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dinero</Text>
          {moneyItems.map(renderMenuItem)}
        </View>

        {/* Recursos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos</Text>
          {resourceItems.map(renderMenuItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginTop: SIZES.lg,
    marginBottom: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    marginLeft: SIZES.md,
  },
  profileName: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 4,
  },

  // Sections
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  menuItemText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.white,
    marginLeft: SIZES.md,
  },
  menuItemTextDestructive: {
    color: COLORS.error || '#DC2626',
  },
});

export default DriverMenuScreen;
