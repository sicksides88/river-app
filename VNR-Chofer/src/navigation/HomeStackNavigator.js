import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import DeliveryTrackingScreen from '../screens/services/DeliveryTrackingScreen';
import DeliverySearchingScreen from '../screens/services/DeliverySearchingScreen';
import CancelDeliveryScreen from '../screens/services/CancelDeliveryScreen';
// Chat y Rating
import { ChatScreen } from '../screens/chat';
import { RateRideScreen } from '../screens/rating';

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          title: 'VNR',
          headerShown: false,
        }}
      />
      {/* Pantallas de seguimiento de envío - dentro del tab para mostrar navbar */}
      <Stack.Screen
        name="DeliveryTracking"
        component={DeliveryTrackingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DeliverySearching"
        component={DeliverySearchingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="CancelDelivery"
        component={CancelDeliveryScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.white,
        }}
      />
      <Stack.Screen
        name="RateRide"
        component={RateRideScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
