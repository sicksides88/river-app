import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, SIZES } from '../../../constants/theme';

const steps = [
  {
    id: 'foto_perfil',
    title: 'Foto de perfil',
    screen: 'PhotoUpload',
    params: { type: 'profile' },
  },
  {
    id: 'licencia',
    title: 'Licencia de conducir',
    screen: 'PhotoUpload',
    params: { type: 'license' },
  },
  {
    id: 'cedula',
    title: 'Cédula del vehículo',
    screen: 'PhotoUpload',
    params: { type: 'vehicle' },
  },
];

const DriverWelcomeScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { serviceType } = route.params || {};

  const handleStepPress = (step) => {
    navigation.navigate(step.screen, {
      ...step.params,
      serviceType,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Te damos la bienvenida, {user?.nombre || 'Usuario'}
        </Text>
        <Text style={styles.subtitle}>
          Solo te faltan 3 pasos para comenzar a ganar con la app.
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index < steps.length - 1 && styles.progressSegmentMargin,
              ]}
            />
          ))}
        </View>

        {/* Steps list */}
        <View style={styles.stepsList}>
          {steps.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={styles.stepItem}
              onPress={() => handleStepPress(step)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={'rgba(255,255,255,0.7)'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: SIZES.lg,
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: SIZES.xl,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
  },
  progressSegmentMargin: {
    marginRight: SIZES.xs,
  },
  stepsList: {
    marginTop: SIZES.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  stepTitle: {
    fontSize: SIZES.body,
    color: COLORS.white,
    fontWeight: '500',
  },
});

export default DriverWelcomeScreen;
