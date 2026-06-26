import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common';

// Navigators
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';
import DriverTabNavigator from './DriverTabNavigator';
import ServicesStackNavigator from './ServicesStackNavigator';
import DriverOnboardingStack from './DriverOnboardingStack';
import WalletStackNavigator from './WalletStackNavigator';

const RootStack = createNativeStackNavigator();

// Servicios que requieren modo conductor
const DRIVER_SERVICES = ['vuelta_segura', 'fletes', 'cadete', 'chofer'];

const AppNavigator = () => {
  const { isAuthenticated, loading, user, activeMode } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Cargando..." />;
  }

  // Verificar si el usuario completó el onboarding
  const needsOnboarding = isAuthenticated && user && !user.onboarding_completed;

  // Verificar si el usuario tiene servicios de conductor
  const hasDriverServices = user?.selected_services?.some(service =>
    DRIVER_SERVICES.includes(service)
  );

  // Determinar si es solo driver (legacy: si no tiene activeMode pero es driver)
  const isDriver = hasDriverServices;

  // Para usuarios dual-role, usar activeMode para decidir qué navigator mostrar
  const showDriverNav = isDriver && activeMode === 'driver';
  const showClientNav = !isDriver || activeMode === 'client';

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : showDriverNav ? (
          // Modo conductor activo
          <>
            <RootStack.Screen name="DriverMain" component={DriverTabNavigator} />
            <RootStack.Screen
              name="Wallet"
              component={WalletStackNavigator}
              options={{
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          // Modo cliente (o usuario sin servicios driver)
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen
              name="Services"
              component={ServicesStackNavigator}
              options={{
                presentation: 'modal',
              }}
            />
            {/* Modo Conductor (con onboarding) - solo si no es dual role */}
            {!hasDriverServices && (
              <RootStack.Screen
                name="DriverMode"
                component={DriverOnboardingStack}
                options={{
                  animation: 'slide_from_bottom',
                }}
              />
            )}
            {/* Wallet del usuario */}
            <RootStack.Screen
              name="Wallet"
              component={WalletStackNavigator}
              options={{
                presentation: 'modal',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
