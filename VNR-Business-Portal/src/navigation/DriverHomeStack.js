import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

import DriverHomeScreen from '../screens/driver/home/DriverHomeScreen';
import TripRequestScreen from '../screens/driver/home/TripRequestScreen';
import TripActiveScreen from '../screens/driver/home/TripActiveScreen';
import TripCompletedScreen from '../screens/driver/home/TripCompletedScreen';
import CancelTripScreen from '../screens/driver/home/CancelTripScreen';
import AddVehicleScreen from '../screens/driver/vehicles/AddVehicleScreen';
import PhotoUploadScreen from '../screens/driver/onboarding/PhotoUploadScreen';

// Chat
import { ChatScreen } from '../screens/chat';

// Rating
import { RateUserScreen } from '../screens/rating';

const Stack = createNativeStackNavigator();

const DriverHomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      <Stack.Screen name="TripRequest" component={TripRequestScreen} />
      <Stack.Screen name="TripActive" component={TripActiveScreen} />
      <Stack.Screen name="TripCompleted" component={TripCompletedScreen} />
      <Stack.Screen name="CancelTrip" component={CancelTripScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      {/* Subir documentos */}
      <Stack.Screen name="DriverDocuments" component={PhotoUploadScreen} />
      {/* Chat con el pasajero */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />
      {/* Calificar pasajero */}
      <Stack.Screen
        name="RateUser"
        component={RateUserScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default DriverHomeStack;
