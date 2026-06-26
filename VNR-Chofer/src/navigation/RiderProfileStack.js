import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RiderProfileScreen, MiUnidadAuxilioScreen, RiderMisDatosScreen, EditarUnidadAuxilioScreen, RiderDisponibilidadScreen, MisTurnosScreen } from '../screens/rider';

const Stack = createNativeStackNavigator();

const RiderProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RiderProfile" component={RiderProfileScreen} />
    <Stack.Screen name="RiderMisDatos" component={RiderMisDatosScreen} />
    <Stack.Screen name="MiUnidadAuxilio" component={MiUnidadAuxilioScreen} />
    <Stack.Screen name="EditarUnidadAuxilio" component={EditarUnidadAuxilioScreen} />
    <Stack.Screen name="RiderDisponibilidad" component={RiderDisponibilidadScreen} />
    <Stack.Screen name="MisTurnos" component={MisTurnosScreen} />
  </Stack.Navigator>
);

export default RiderProfileStack;
