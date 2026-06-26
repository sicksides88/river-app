import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';

// ProfileScreen - "Más" idéntico al diseño Figma
// Servicios que requieren modo conductor
const DRIVER_SERVICES = ['vuelta_segura', 'fletes', 'cadete', 'chofer'];

const ProfileScreen = ({ navigation }) => {
  const { user, logout, switchMode, activeMode } = useAuth();

  const hasDriverServices = user?.selected_services?.some(service =>
    DRIVER_SERVICES.includes(service)
  );
  const isDualRole = hasDriverServices;

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

  // Menú simple como en Figma
  const menuItems = [
    {
      id: 'notificaciones',
      title: 'Notificaciones',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'mensajes',
      title: 'Mensajes',
      icon: 'chatbubbles-outline',
      onPress: () => navigation.navigate('Conversations'),
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'payment',
      title: 'Métodos de pago',
      icon: 'card-outline',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    ...(isDualRole ? [{
      id: 'switch_driver',
      title: 'Cambiar a modo conductor',
      icon: 'swap-horizontal-outline',
      onPress: () => switchMode('driver'),
      isHighlight: true,
    }] : [{
      id: 'ganancias',
      title: 'Genera ganancias: conduce o haz entregas',
      icon: 'cash-outline',
      onPress: () => navigation.navigate('DriverMode'),
    }]),
    {
      id: 'legal',
      title: 'Legal',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
    },
    {
      id: 'logout',
      title: 'Cerrar sesión',
      icon: 'log-out-outline',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con nombre y avatar - como en Figma */}
      <View style={styles.header}>
        <Text style={styles.userName}>
          {user?.nombre || ''} {user?.apellido || ''}
        </Text>

        {/* Avatar */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarOutline}>
              <Ionicons name="person-outline" size={28} color={COLORS.text} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Menú */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={item.isDestructive ? COLORS.error : COLORS.text}
            />
            <Text style={[
              styles.menuItemText,
              item.isDestructive && styles.menuItemTextDestructive
            ]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header con nombre y avatar
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.lg,
  },
  userName: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Avatar
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarOutline: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Menú
  menuContainer: {
    paddingHorizontal: SIZES.screenPadding,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  menuItemText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    flex: 1,
  },
  menuItemTextDestructive: {
    color: COLORS.error || '#DC2626',
  },
});

export default ProfileScreen;
