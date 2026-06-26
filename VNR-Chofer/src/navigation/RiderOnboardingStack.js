import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { driverService } from '../services';
import { COLORS } from '../constants/theme';
import RiderTabNavigator from './RiderTabNavigator';
import DriverServiceSelectionScreen from '../screens/driver/onboarding/DriverServiceSelectionScreen';
import { DriverRegistrationStepsScreen } from '../screens/onboarding/driver-registration';

const Stack = createNativeStackNavigator();

const RiderStatusCheck = ({ navigation }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await driverService.getDriverStatus();
        if (response?.success && response.isDriver) {
          if (response.status === 'active' || response.status === 'pending_review') {
            navigation.replace('RiderMain');
            return;
          }
          if (response.status === 'pending_documents') {
            navigation.replace('DriverRegistrationSteps', { serviceType: response.driverType || 'auxilio' });
            return;
          }
        }
        navigation.replace('DriverServiceSelection');
      } catch {
        navigation.replace('RiderMain');
      } finally {
        setChecking(false);
      }
    })();
  }, [navigation]);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.riderBlue} />
      </View>
    );
  }
  return null;
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.riderNavy },
});

const RiderOnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RiderStatusCheck" component={RiderStatusCheck} />
    <Stack.Screen name="DriverServiceSelection" component={DriverServiceSelectionScreen} />
    <Stack.Screen name="DriverRegistrationSteps" component={DriverRegistrationStepsScreen} />
    <Stack.Screen name="RiderMain" component={RiderTabNavigator} />
  </Stack.Navigator>
);

export default RiderOnboardingStack;
