import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { AppNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/common';

export default function App() {
  useEffect(() => {
    // Hacer barra de navegación de Android transparente para que no tape el tab bar
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#ffffff00');
      NavigationBar.setPositionAsync('absolute');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <SocketProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </SocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
