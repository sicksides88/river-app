import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MisTurnosScreen, RiderDisponibilidadScreen } from '../screens/rider';

const Stack = createNativeStackNavigator();

const RiderTurnosStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MisTurnos" component={MisTurnosScreen} />
    <Stack.Screen name="RiderDisponibilidad" component={RiderDisponibilidadScreen} />
  </Stack.Navigator>
);

export default RiderTurnosStack;
