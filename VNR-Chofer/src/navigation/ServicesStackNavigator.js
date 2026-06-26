import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import VueltaSeguraScreen from '../screens/services/VueltaSeguraScreen';
import SelectServiceScreen from '../screens/services/SelectServiceScreen';
import TripActiveScreen from '../screens/services/TripActiveScreen';
import EnviosScreen from '../screens/services/EnviosScreen';
import EnviosInitialScreen from '../screens/services/EnviosInitialScreen';
import FletesScreen from '../screens/services/FletesScreen';
import FletesInitialScreen from '../screens/services/FletesInitialScreen';
import ChoferScreen from '../screens/services/ChoferScreen';
import ChoferInitialScreen from '../screens/services/ChoferInitialScreen';
import RideConfirmScreen from '../screens/services/RideConfirmScreen';
import DeliveryConfirmScreen from '../screens/services/DeliveryConfirmScreen';
import DeliverySearchingScreen from '../screens/services/DeliverySearchingScreen';
import DeliveryTrackingScreen from '../screens/services/DeliveryTrackingScreen';
import ElegiConductorScreen from '../screens/services/ElegiConductorScreen';
import EsperaScreen from '../screens/services/EsperaScreen';
import ViajeAceptadoScreen from '../screens/services/ViajeAceptadoScreen';
import SeleccionarDiaHoraScreen from '../screens/services/SeleccionarDiaHoraScreen';
import EnviarArticuloScreen from '../screens/services/EnviarArticuloScreen';
import RecibirArticuloScreen from '../screens/services/RecibirArticuloScreen';
import EnviosDimensionesScreen from '../screens/services/EnviosDimensionesScreen';
import OpcionesPagoScreen from '../screens/services/OpcionesPagoScreen';
import ProgramacionHorariosScreen from '../screens/services/ProgramacionHorariosScreen';
import ViajeAceptadoChoferScreen from '../screens/services/ViajeAceptadoChoferScreen';
import CancelDeliveryScreen from '../screens/services/CancelDeliveryScreen';
// Chat
import { ChatScreen } from '../screens/chat';

// Rating
import { RateRideScreen } from '../screens/rating';

const Stack = createNativeStackNavigator();

const ServicesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="VueltaSegura"
        component={VueltaSeguraScreen}
        options={{
          headerShown: false, // Using custom header in component
        }}
      />
      <Stack.Screen
        name="SelectService"
        component={SelectServiceScreen}
        options={{
          headerShown: false, // Map fullscreen with back button
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="TripActive"
        component={TripActiveScreen}
        options={{
          headerShown: false, // Map fullscreen with driver card
          presentation: 'card',
          gestureEnabled: false, // Prevent swipe back during trip
        }}
      />
      <Stack.Screen
        name="Envios"
        component={EnviosScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EnviosInitial"
        component={EnviosInitialScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Fletes"
        component={FletesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FletesInitial"
        component={FletesInitialScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chofer"
        component={ChoferScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChoferInitial"
        component={ChoferInitialScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RideConfirm"
        component={RideConfirmScreen}
        options={{
          title: 'Confirmar Viaje',
        }}
      />
      <Stack.Screen
        name="DeliveryConfirm"
        component={DeliveryConfirmScreen}
        options={{
          title: 'Confirmar Envío',
        }}
      />
      <Stack.Screen
        name="DeliverySearching"
        component={DeliverySearchingScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="DeliveryTracking"
        component={DeliveryTrackingScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ElegiConductor"
        component={ElegiConductorScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Espera"
        component={EsperaScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ViajeAceptado"
        component={ViajeAceptadoScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="SeleccionarDiaHora"
        component={SeleccionarDiaHoraScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EnviarArticulo"
        component={EnviarArticuloScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RecibirArticulo"
        component={RecibirArticuloScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EnviosDimensiones"
        component={EnviosDimensionesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OpcionesPago"
        component={OpcionesPagoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProgramacionHorarios"
        component={ProgramacionHorariosScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ViajeAceptadoChofer"
        component={ViajeAceptadoChoferScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: false,
        }}
      />
      {/* Chat durante el viaje */}
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
          presentation: 'card',
        }}
      />
      {/* Calificar viaje */}
      <Stack.Screen
        name="RateRide"
        component={RateRideScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
        }}
      />
      {/* Cancelar envío (cliente) */}
      <Stack.Screen
        name="CancelDelivery"
        component={CancelDeliveryScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default ServicesStackNavigator;
