import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  RiderServicioHubScreen,
  ServicioActivoScreen,
  FirmaConformidadScreen,
  EmbarcacionAsistidaScreen,
  ConfirmarLugarInicioScreen,
  RechazoSeguridadScreen,
} from '../screens/rider';

const Stack = createNativeStackNavigator();

const RiderServicioStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RiderServicioHub" component={RiderServicioHubScreen} />
    <Stack.Screen name="ConfirmarLugarInicio" component={ConfirmarLugarInicioScreen} />
    <Stack.Screen name="ServicioActivo" component={ServicioActivoScreen} />
    <Stack.Screen name="FirmaConformidad" component={FirmaConformidadScreen} />
    <Stack.Screen name="EmbarcacionAsistida" component={EmbarcacionAsistidaScreen} />
    <Stack.Screen name="RechazoSeguridad" component={RechazoSeguridadScreen} />
  </Stack.Navigator>
);

export default RiderServicioStack;
