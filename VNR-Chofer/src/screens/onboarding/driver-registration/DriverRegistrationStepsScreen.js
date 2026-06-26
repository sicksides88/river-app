import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { TermsAndConditionsModal } from '../../../components/common';
import driverService from '../../../services/driver.service';
import { COLORS, SIZES } from '../../../constants/theme';

// Unified steps for ALL driver services
// Nota: seguro_vehiculo y cédula del vehículo se piden al dar de alta un vehículo
const UNIFIED_STEPS = [
  { id: 'terms', title: 'Términos y Condiciones', screen: null, isTerms: true },
  { id: 'profile_photo', title: 'Foto de perfil', screen: 'ProfilePhoto' },
  { id: 'license', title: 'Licencia de conducir', screen: 'LicensePhoto' },
  { id: 'buena_conducta', title: 'Certificado de buena conducta', screen: 'DocumentUpload', docType: 'buena_conducta' },
  { id: 'seguro_accidentes', title: 'Seguro de accidentes personales', screen: 'DocumentUpload', docType: 'seguro_accidentes' },
];

const ALL_DRIVER_SERVICES = ['vuelta_segura', 'cadete', 'fletes', 'chofer'];

const DriverRegistrationStepsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user, updateProfile, switchMode } = useAuth();
  const serviceType = route.params?.serviceType || 'vuelta_segura';
  // Si el usuario ya completó onboarding, está registrándose como driver desde la app
  const isExistingUser = user?.onboarding_completed === true;
  const [finishing, setFinishing] = useState(false);

  const [completedSteps, setCompletedSteps] = useState({
    terms: false,
    profile_photo: false,
    license: false,
    buena_conducta: false,
    seguro_accidentes: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [rejectedSteps, setRejectedSteps] = useState({});

  // Al montar, verificar documentos ya subidos y términos aceptados
  useEffect(() => {
    const checkUploadedDocs = async () => {
      try {
        const uploaded = {};

        // Verificar si ya aceptó términos (persiste en perfil)
        if (user?.terms_accepted) {
          uploaded.terms = true;
        }

        const response = await driverService.getDriverStatus();
        const docs = (response.isDriver && response.documents) ? response.documents : [];

        // Mapa de paso -> tipos de documento que lo componen
        const STEP_DOC_TYPES = {
          profile_photo: ['selfie_verification'],
          license: ['license_front', 'license_back'],
          buena_conducta: ['buena_conducta'],
          seguro_accidentes: ['seguro_accidentes'],
        };

        const rejected = {};
        Object.entries(STEP_DOC_TYPES).forEach(([stepId, types]) => {
          let anyExists = false, anyRejected = false, reason = '';
          types.forEach(t => {
            // Tomar la versión MÁS RECIENTE de ese tipo (por si re-subió uno rechazado).
            const latest = docs
              .filter(d => d.document_type === t)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            if (!latest) return;
            anyExists = true;
            if (latest.status === 'rejected') {
              anyRejected = true;
              reason = latest.rejection_reason || reason;
            }
          });
          if (!anyExists) return;
          if (anyRejected) {
            rejected[stepId] = reason || 'Necesitamos que lo vuelvas a subir.';
          } else {
            uploaded[stepId] = true;
          }
        });

        setRejectedSteps(rejected);
        setCompletedSteps(prev => {
          const next = { ...prev, ...uploaded };
          // Asegurar que un paso rechazado NO quede marcado como completo.
          Object.keys(rejected).forEach(k => { next[k] = false; });
          return next;
        });
      } catch (e) {
        // Ignorar, continuar con estado local
      }
    };
    checkUploadedDocs();
  }, [user?.terms_accepted]);

  // Verificar pasos completados cuando se vuelve a esta pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.completedStep) {
        setCompletedSteps(prev => ({
          ...prev,
          [route.params.completedStep]: true,
        }));
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const steps = UNIFIED_STEPS.map(step => ({
    ...step,
    completed: completedSteps[step.id] && !rejectedSteps[step.id],
    rejected: !!rejectedSteps[step.id],
    rejectReason: rejectedSteps[step.id],
  }));

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = steps.length;
  const allCompleted = completedCount === totalSteps;

  const handleFinish = async () => {
    // Orden del alta: tras los Documentos sigue el Vehículo (y luego Disponibilidad).
    setFinishing(true);
    try {
      navigation.navigate('VehicleRegistration', { serviceType, isOnboarding: true });
    } catch (error) {
      console.error('Error avanzando al registro de vehículo:', error);
      Alert.alert('Error', 'No se pudo continuar. Intenta nuevamente.');
    } finally {
      setFinishing(false);
    }
  };

  const handleStepPress = (step) => {
    if (step.isTerms) {
      setShowTermsModal(true);
    } else if (step.screen === 'DocumentUpload') {
      navigation.navigate('DocumentUpload', { docType: step.docType, serviceType });
    } else if (step.screen) {
      navigation.navigate(step.screen, { serviceType });
    }
  };

  const handleAcceptTerms = async () => {
    setCompletedSteps(prev => ({ ...prev, terms: true }));
    setShowTermsModal(false);
    // Persistir en backend para no volver a pedir
    try {
      await updateProfile({ terms_accepted: true });
    } catch (e) {
      console.log('Error guardando terms_accepted:', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header con botón atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Titulo con nombre del usuario */}
        <Text style={styles.title}>
          Te damos la bienvenida,{'\n'}{user?.nombre || 'Usuario'}
        </Text>
        <Text style={styles.subtitle}>
          Solo te faltan {totalSteps - completedCount} pasos para comenzar a ganar con la app.
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressSegment,
                step.completed && styles.progressSegmentCompleted,
                index < steps.length - 1 && styles.progressSegmentMargin,
              ]}
            />
          ))}
        </View>

        {/* Lista de pasos */}
        <View style={styles.stepsList}>
          {steps.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={styles.stepItem}
              onPress={() => handleStepPress(step)}
              activeOpacity={0.7}
            >
              <View style={styles.stepLeft}>
                {step.rejected ? (
                  <Ionicons name="alert-circle" size={24} color="#ef4444" />
                ) : step.completed ? (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success || '#22c55e'} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color={'rgba(255,255,255,0.55)'} />
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}>{step.title}</Text>
                  {step.rejected && (
                    <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                      Rechazado: {step.rejectReason} · Tocá para volver a subir
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={'rgba(255,255,255,0.55)'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Botón Finalizar */}
      {allCompleted && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SIZES.md }]}>
          <TouchableOpacity
            style={[styles.finishButton, finishing && styles.finishButtonDisabled]}
            onPress={handleFinish}
            disabled={finishing}
            activeOpacity={0.8}
          >
            {finishing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.finishButtonText}>Finalizar registro</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptTerms}
        type="driver"
      />
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
    paddingVertical: SIZES.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
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
    marginBottom: SIZES.lg,
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.xxl,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
  },
  progressSegmentCompleted: {
    backgroundColor: COLORS.white,
  },
  progressSegmentMargin: {
    marginRight: SIZES.sm,
  },
  stepsList: {
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  stepTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
  },
  stepTitleCompleted: {
    color: 'rgba(255,255,255,0.72)',
  },
  bottomContainer: {
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
  },
  finishButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default DriverRegistrationStepsScreen;
