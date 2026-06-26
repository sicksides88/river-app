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

import {
  RiderGuardiaScreen,
  AcceptAuxilioScreen,
  RejectAuxilioScreen,
  ServicioActivoScreen,
  SinTurnoScreen,
  OfflineScreen,
  RiderScheduleScreen,
} from '../screens/rider';

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
      <Stack.Screen name="RiderGuardia" component={RiderGuardiaScreen} />
      <Stack.Screen name="AcceptAuxilio" component={AcceptAuxilioScreen} />
      <Stack.Screen name="RejectAuxilio" component={RejectAuxilioScreen} />
      <Stack.Screen name="ServicioActivo" component={ServicioActivoScreen} />
      <Stack.Screen name="SinTurno" component={SinTurnoScreen} />
      <Stack.Screen name="Offline" component={OfflineScreen} />
      <Stack.Screen name="RiderSchedule" component={RiderScheduleScreen} />

      {/* Pantallas driver legacy (VNR movilidad) */}
      <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      <Stack.Screen name="TripRequest" component={TripRequestScreen} />
      <Stack.Screen name="TripActive" component={TripActiveScreen} />
      <Stack.Screen name="TripCompleted" component={TripCompletedScreen} />
      <Stack.Screen name="CancelTrip" component={CancelTripScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="DriverDocuments" component={PhotoUploadScreen} />
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
