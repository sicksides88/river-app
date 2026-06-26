import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { driverService, servicesService, toCanonicalService } from '../../../services';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';

const serviceOptions = [
  {
    id: 'cadete',
    title: 'Cadete',
    age: 'Más de 18',
    vehicle: 'Moto o auto 2000 en adelante',
    requirements: 'Baúl o espacio adecuado para paquetes pequeños y medianos',
    icon: 'bicycle',
  },
  {
    id: 'chofer',
    title: 'Chofer',
    age: 'Más de 24',
    vehicle: '2005 en adelante, 4 puertas',
    requirements: 'Buena presencia, auto en excelente estado',
    icon: 'person',
  },
  {
    id: 'fletes',
    title: 'Fletes',
    age: 'Más de 18',
    vehicle: 'Camioneta o furgón 2005 en adelante',
    requirements: 'Espacio amplio para carga',
    icon: 'bus',
  },
  {
    id: 'vuelta_segura',
    title: 'Conducción Segura',
    icon: 'shield-checkmark',
    locked: true,
    lockedReason: 'Se desbloquea cuando generás confianza: con buenas reseñas en tus viajes y envíos, la app te habilita este servicio.',
  },
];

const DriverServiceSelectionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDualRole = route.params?.isDualRole || false;
  const [selectedServices, setSelectedServices] = useState([]);
  const [cadeteria, setCadeteria] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [enabledServices, setEnabledServices] = useState(null);

  // Cargar servicios habilitados por la plataforma (CRM)
  useEffect(() => {
    servicesService.getEnabled().then(setEnabledServices);
  }, []);

  // Verificar si ya es conductor al cargar
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await driverService.getDriverStatus();
        if (response.isDriver) {
          if (response.status === 'pending_documents') {
            // Navigate to registration steps (works in both OnboardingNavigator and DriverOnboardingStack)
            const target = navigation.getState().routeNames.includes('DriverRegistrationSteps')
              ? 'DriverRegistrationSteps'
              : 'DriverWelcome';
            navigation.replace(target, {
              serviceType: response.driverType || 'vuelta_segura'
            });
            return;
          } else if (response.status === 'active') {
            if (navigation.getState().routeNames.includes('DriverMain')) {
              navigation.replace('DriverMain');
            }
            return;
          }
        }
      } catch (error) {
        console.log('Error checking status, continue with selection:', error.message);
      }
      setInitialLoading(false);
    };

    checkStatus();
  }, [navigation]);

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  const handleContinue = async () => {
    if (selectedServices.length === 0) return;

    setLoading(true);
    try {
      const primaryService = selectedServices[0];
      const response = await driverService.registerAsDriver(
        primaryService,
        null,
        selectedServices,
        selectedServices.includes('cadete') ? cadeteria : null
      );

      if (response.success) {
        // Todos los servicios van a DriverSchedule
        navigation.navigate('DriverRegistrationSteps', {
          serviceType: primaryService,
          isOnboarding: true,
        });
      } else {
        Alert.alert('Error', response.message || 'No se pudo completar el registro');
      }
    } catch (error) {
      console.error('Error registering as driver:', error);

      if (error.response?.status === 400) {
        try {
          const statusResponse = await driverService.getDriverStatus();
          if (statusResponse.isDriver) {
            navigation.navigate('DriverRegistrationSteps', {
              serviceType: statusResponse.driverType || selectedServices[0],
              isOnboarding: true,
            });
            return;
          }
        } catch (e) {
          navigation.navigate('DriverRegistrationSteps', {
            serviceType: selectedServices[0],
            isOnboarding: true,
          });
          return;
        }
      }

      Alert.alert(
        'Error',
        error.response?.data?.message || 'Error de conexión. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = () => {
    navigation.goBack();
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Elegí los servicios que querés ofrecer
        </Text>
        <Text style={styles.subtitle}>
          Podés seleccionar más de uno. Los documentos requeridos son los mismos para todos.
        </Text>

        {/* Service options - multi-select (solo los habilitados por la plataforma) */}
        {serviceOptions
          .filter((service) => !enabledServices || enabledServices.includes(toCanonicalService(service.id)))
          .map((service) => {
          if (service.locked) {
            return (
              <View key={service.id} style={[styles.serviceCard, styles.serviceCardLocked]}>
                <View style={styles.serviceHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.serviceTitle, { color: COLORS.textMuted, flex: 0 }]}>{service.title}</Text>
                  </View>
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>SE DESBLOQUEA</Text>
                  </View>
                </View>
                <Text style={[styles.serviceLabel, { marginTop: 6, lineHeight: 18 }]}>
                  {service.lockedReason}
                </Text>
              </View>
            );
          }
          const isSelected = selectedServices.includes(service.id);
          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                isSelected && styles.serviceCardSelected,
              ]}
              onPress={() => toggleService(service.id)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <View style={styles.checkboxArea}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                  </View>
                </View>
              </View>

              <View style={styles.serviceDetails}>
                <Text style={styles.serviceLabel}>
                  <Text style={styles.serviceLabelBold}>Edad: </Text>
                  {service.age}
                </Text>
                <Text style={styles.serviceLabel}>
                  <Text style={styles.serviceLabelBold}>Vehículo: </Text>
                  {service.vehicle}
                </Text>
                {service.requirements && (
                  <Text style={styles.serviceLabel}>
                    <Text style={styles.serviceLabelBold}>Requisitos: </Text>
                    {service.requirements}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Campo Cadetería si cadete está seleccionado */}
        {selectedServices.includes('cadete') && (
          <View style={styles.cadeteriaContainer}>
            <Text style={styles.cadeteriaLabel}>Nombre de cadetería (opcional)</Text>
            <TextInput
              style={styles.cadeteriaInput}
              value={cadeteria}
              onChangeText={setCadeteria}
              placeholder="Ej: Mi Cadetería"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        )}

        {/* Request ride link */}
        {!isDualRole && (
          <TouchableOpacity
            style={styles.requestRideLink}
            onPress={handleRequestRide}
          >
            <Text style={styles.requestRideLinkText}>
              Solicitar un viaje en su lugar
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Continue button */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (selectedServices.length === 0 || loading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedServices.length === 0 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={[
              styles.continueButtonText,
              selectedServices.length === 0 && styles.continueButtonTextDisabled,
            ]}>
              Continuar{selectedServices.length > 0 ? ` (${selectedServices.length})` : ''}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xl,
    paddingBottom: 120,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.sm,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  serviceCardSelected: {
    borderColor: COLORS.text,
  },
  serviceCardLocked: {
    backgroundColor: COLORS.backgroundTertiary,
    opacity: 0.95,
  },
  lockedBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lockedBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  serviceTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  checkboxArea: {
    marginLeft: SIZES.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.text,
  },
  serviceDetails: {
    gap: 4,
  },
  serviceLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  serviceLabelBold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  cadeteriaContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  cadeteriaLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  cadeteriaInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  requestRideLink: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    marginTop: SIZES.sm,
  },
  requestRideLinkText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textDecorationLine: 'underline',
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
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.borderLight,
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

export default DriverServiceSelectionScreen;
