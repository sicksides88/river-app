import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  RiderGuardiaScreen,
  AcceptAuxilioScreen,
  RejectAuxilioScreen,
  SinTurnoScreen,
  OfflineScreen,
  RechazoSeguridadScreen,
} from '../screens/rider';

const Stack = createNativeStackNavigator();

const RiderHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RiderGuardia" component={RiderGuardiaScreen} />
    <Stack.Screen name="Offline" component={OfflineScreen} />
    <Stack.Screen name="SinTurno" component={SinTurnoScreen} />
    <Stack.Screen name="AcceptAuxilio" component={AcceptAuxilioScreen} />
    <Stack.Screen name="RejectAuxilio" component={RejectAuxilioScreen} />
    <Stack.Screen name="RechazoSeguridad" component={RechazoSeguridadScreen} />
  </Stack.Navigator>
);

export default RiderHomeStack;
