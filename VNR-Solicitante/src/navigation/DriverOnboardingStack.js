import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { driverService } from '../services';
import { COLORS } from '../constants/theme';

const ALL_SERVICES = ['vuelta_segura', 'cadete', 'fletes', 'chofer'];

import DriverScheduleScreen from '../screens/driver/schedule/DriverScheduleScreen';
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
      console.log('🔍 Checking driver status...');
      const response = await driverService.getDriverStatus();
      console.log('📋 Driver status response:', JSON.stringify(response, null, 2));

      if (response.success) {
        if (!response.isDriver) {
          console.log('➡️ Not a driver, registering and going to DriverSchedule');
          try {
            await driverService.registerAsDriver('vuelta_segura', null, ALL_SERVICES);
          } catch (regError) {
            if (regError.response?.status !== 400) {
              console.error('❌ Error registering as driver:', regError);
              return;
            }
          }
          navigation.replace('DriverSchedule', { isOnboarding: true });
        } else if (response.status === 'active') {
          console.log('➡️ Active driver, going to DriverMain');
          navigation.replace('DriverMain');
        } else if (response.status === 'pending_documents') {
          console.log('➡️ Pending documents, going to DriverRegistrationSteps');
          navigation.replace('DriverRegistrationSteps', { serviceType: response.driverType });
        } else if (response.status === 'pending_review') {
          console.log('➡️ Pending review, going to DriverMain');
          navigation.replace('DriverMain');
        } else {
          console.log('➡️ Unknown status:', response.status, ', registering and going to DriverSchedule');
          try {
            await driverService.registerAsDriver('vuelta_segura', null, ALL_SERVICES);
          } catch (regError) {
            if (regError.response?.status !== 400) {
              console.error('❌ Error registering as driver:', regError);
              return;
            }
          }
          navigation.replace('DriverSchedule', { isOnboarding: true });
        }
      } else {
        console.log('❌ Response not successful, registering and going to DriverSchedule');
        try {
          await driverService.registerAsDriver('vuelta_segura', null, ALL_SERVICES);
        } catch (regError) {
          if (regError.response?.status !== 400) {
            console.error('❌ Error registering as driver:', regError);
            return;
          }
        }
        navigation.replace('DriverSchedule', { isOnboarding: true });
      }
    } catch (error) {
      console.error('❌ Error checking driver status:', error);
      console.error('Error details:', error.response?.data);
      // Si hay error, intentar registrar como conductor
      try {
        await driverService.registerAsDriver('vuelta_segura', null, ALL_SERVICES);
        navigation.replace('DriverSchedule', { isOnboarding: true });
      } catch (regError) {
        console.error('❌ Error registering as driver:', regError);
      }
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

      {/* Onboarding screens */}
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
