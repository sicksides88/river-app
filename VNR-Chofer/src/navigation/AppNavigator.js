import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common';
import { isRiverMode } from '../constants/config';

import AuthNavigator from './AuthNavigator';
import DriverOnboardingStack from './DriverOnboardingStack';
import RiderOnboardingStack from './RiderOnboardingStack';

const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Cargando..." />;
  }

  const MainFlow = isRiverMode() ? RiderOnboardingStack : DriverOnboardingStack;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="MainFlow" component={MainFlow} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
