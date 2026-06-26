import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { Loading } from '../components/common';
import AuthNavigator from './AuthNavigator';
import AuthenticatedRootNavigator from './AuthenticatedRootNavigator';
import RiverOnboardingStack from './RiverOnboardingStack';
import { authService, membershipService } from '../services';

const RootStack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(null);

  const refreshOnboardingState = useCallback(async () => {
    try {
      const response = await authService.getMe();
      const complete = await membershipService.syncOnboardingFromUser(response.user);
      setNeedsOnboarding(!complete);
    } catch {
      const local = await membershipService.isOnboardingCompleteLocal();
      setNeedsOnboarding(!local);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNeedsOnboarding(null);
      return;
    }
    if (user?.onboarding_completed) {
      membershipService.syncOnboardingFromUser(user).then((complete) => {
        setNeedsOnboarding(!complete);
      });
      return;
    }
    refreshOnboardingState();
  }, [isAuthenticated, user?.onboarding_completed, refreshOnboardingState]);

  const completeOnboarding = async () => {
    await membershipService.completeOnboarding();
    setNeedsOnboarding(false);
  };

  if (loading || (isAuthenticated && needsOnboarding === null)) {
    return <Loading fullScreen text="Cargando..." />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <RootStack.Screen name="Onboarding">
            {() => (
              <OnboardingProvider onComplete={completeOnboarding}>
                <RiverOnboardingStack />
              </OnboardingProvider>
            )}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="App" component={AuthenticatedRootNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
