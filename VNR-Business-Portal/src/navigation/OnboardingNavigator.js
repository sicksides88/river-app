import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ServiceSelectionScreen from '../screens/onboarding/ServiceSelectionScreen';
import DriverScheduleScreen from '../screens/driver/schedule/DriverScheduleScreen';
import {
  DriverRegistrationStepsScreen,
  ProfilePhotoScreen,
  LicensePhotoScreen,
  VehicleRegistrationScreen,
  DocumentUploadScreen,
} from '../screens/onboarding/driver-registration';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Pantalla inicial de elección de rol */}
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />

      {/* Configurar horarios */}
      <Stack.Screen name="DriverSchedule" component={DriverScheduleScreen} />

      {/* Flujo de registro de documentos */}
      <Stack.Screen name="DriverRegistrationSteps" component={DriverRegistrationStepsScreen} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
      <Stack.Screen name="LicensePhoto" component={LicensePhotoScreen} />
      <Stack.Screen name="VehicleRegistration" component={VehicleRegistrationScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
