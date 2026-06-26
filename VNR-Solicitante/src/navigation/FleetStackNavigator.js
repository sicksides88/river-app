import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FleetListScreen, FleetDetailScreen, AddVesselScreen } from '../screens/fleet';

const Stack = createNativeStackNavigator();

const FleetStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FleetList" component={FleetListScreen} />
    <Stack.Screen name="FleetDetail" component={FleetDetailScreen} />
    <Stack.Screen name="AddVessel" component={AddVesselScreen} />
  </Stack.Navigator>
);

export default FleetStackNavigator;
