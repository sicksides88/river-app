import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import driverService from '../../services/driver.service';

const roleOptions = [
  {
    id: 'driver',
    title: 'Prestar servicio',
    description: 'Registrate como conductor y empezá a ganar.',
    subtitle: 'También vas a poder solicitar servicios desde la app.',
    icon: 'briefcase-outline',
  },
  {
    id: 'client',
    title: 'Pedir servicio',
    description: 'Pedí viajes, envíos, fletes y más desde la app.',
    subtitle: 'Podés registrarte como conductor en cualquier momento.',
    icon: 'car-outline',
  },
];

const ServiceSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { updateProfile, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Al montar, verificar si ya está registrado como conductor (crash recovery)
  React.useEffect(() => {
    const checkExistingDriver = async () => {
      try {
        const response = await driverService.getDriverStatus();
        if (response.isDriver) {
          const serviceType = response.driverType || 'vuelta_segura';
          if (response.status === 'pending_documents') {
            navigation.replace('DriverRegistrationSteps', { serviceType });
            return;
          } else if (response.status === 'active' || response.status === 'pending_review') {
            await updateProfile({
              selected_services: [serviceType],
              onboarding_completed: true,
            });
            return;
          }
        }
      } catch (e) {
        // No es conductor, continuar normalmente
      }
      setCheckingStatus(false);
    };
    checkExistingDriver();
  }, []);

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

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Seleccioná una opción', 'Elegí qué querés hacer con la app.');
      return;
    }

    setLoading(true);
    try {
      if (selectedRole === 'client') {
        await updateProfile({
          onboarding_completed: true,
          selected_services: [],
        });
      } else {
        // Registrar como conductor con todos los servicios
        await driverService.registerAsDriver(
          'vuelta_segura',
          null,
          ['vuelta_segura', 'cadete', 'fletes', 'chofer']
        );
        navigation.navigate('DriverSchedule', { isOnboarding: true });
      }
    } catch (error) {
      console.error('Error in role selection:', error);
      // Si ya está registrado como conductor, continuar al siguiente paso
      if (error.response?.status === 400) {
        navigation.navigate('DriverSchedule', { isOnboarding: true });
        return;
      }
      Alert.alert('Error', 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con botón de logout */}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.error || '#DC2626'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          ¿Qué querés hacer{'\n'}con la app?
        </Text>

        <Text style={styles.subtitle}>
          Podés cambiar de modo en cualquier momento desde tu perfil.
        </Text>

        {/* Role options */}
        {roleOptions.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                isSelected && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.7}
            >
              <View style={styles.roleHeader}>
                <View style={[styles.roleIconContainer, isSelected && styles.roleIconContainerSelected]}>
                  <Ionicons name={role.icon} size={28} color={isSelected ? COLORS.white : COLORS.text} />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Boton Continuar */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedRole || loading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={[
              styles.continueButtonText,
              !selectedRole && styles.continueButtonTextDisabled,
            ]}>
              Continuar
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
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
  },
  logoutButton: {
    padding: SIZES.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    paddingBottom: 120,
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
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  roleCardSelected: {
    borderColor: COLORS.text,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  roleIconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  roleInfo: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  roleTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  roleSubtitle: {
    fontSize: SIZES.small - 1,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.text,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    paddingBottom: SIZES.xxl,
  },
  continueButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.white,
    opacity: 0.5,
  },
  continueButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: COLORS.textMuted,
  },
});

export default ServiceSelectionScreen;
