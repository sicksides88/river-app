import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { driverService } from '../services';
import { COLORS } from '../constants/theme';

const ALL_SERVICES = ['vuelta_segura', 'cadete', 'fletes', 'chofer'];

import DriverScheduleScreen from '../screens/driver/schedule/DriverScheduleScreen';
import DriverServiceSelectionScreen from '../screens/driver/onboarding/DriverServiceSelectionScreen';
import DriverTabNavigator from './DriverTabNavigator';

// Pantallas de registro (mismas que usa el onboarding inicial)
import {
  DriverRegistrationStepsScreen,
  ProfilePhotoScreen,
  LicensePhotoScreen,
  DocumentUploadScreen,
  VehicleRegistrationScreen,
} from '../screens/onboarding/driver-registration';

const Stack = createNativeStackNavigator();

// Componente que verifica el estado del conductor
const DriverStatusCheck = ({ navigation }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkDriverStatus();
  }, []);

  const checkDriverStatus = async () => {
    try {
      const response = await driverService.getDriverStatus();
      // Orden del alta: Rol -> Documentos -> Vehículo -> Disponibilidad
      if (response?.success && response.isDriver) {
        if (response.status === 'active' || response.status === 'pending_review') {
          navigation.replace('DriverMain');
        } else if (response.status === 'pending_documents') {
          const hasRejected = (response.documents || []).some(d => d.status === 'rejected');
          if (hasRejected) {
            // Tiene documentos rechazados: ir a corregirlos.
            navigation.replace('DriverRegistrationSteps', { serviceType: response.driverType });
          } else if (response.documents && response.documents.length > 0) {
            // Ya subió todo: mostrar Home en estado "en revisión".
            navigation.replace('DriverMain');
          } else {
            navigation.replace('DriverRegistrationSteps', { serviceType: response.driverType });
          }
        } else {
          navigation.replace('DriverServiceSelection');
        }
      } else {
        // Todavía no es conductor: empieza eligiendo el rol
        navigation.replace('DriverServiceSelection');
      }
    } catch (error) {
      console.error('Error checking driver status:', error);
      navigation.replace('DriverServiceSelection');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text} />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

const DriverOnboardingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Status check - punto de entrada */}
      <Stack.Screen name="DriverStatusCheck" component={DriverStatusCheck} />

      {/* Onboarding screens (orden: Rol → Documentos → Vehículo → Disponibilidad) */}
      <Stack.Screen name="DriverServiceSelection" component={DriverServiceSelectionScreen} />
      <Stack.Screen name="DriverSchedule" component={DriverScheduleScreen} />
      <Stack.Screen name="DriverRegistrationSteps" component={DriverRegistrationStepsScreen} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
      <Stack.Screen name="LicensePhoto" component={LicensePhotoScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen name="VehicleRegistration" component={VehicleRegistrationScreen} />

      {/* Main driver app (after onboarding) */}
      <Stack.Screen name="DriverMain" component={DriverTabNavigator} />
    </Stack.Navigator>
  );
};

export default DriverOnboardingStack;
