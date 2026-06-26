import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/common';
import HomeStackNavigator from './HomeStackNavigator';
import ActivityStackNavigator from './ActivityStackNavigator';
import FleetStackNavigator from './FleetStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

// River Service: Inicio · Actividad · Flota · Perfil
const MainTabNavigator = () => (
  <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Inicio' }} />
    <Tab.Screen name="ActivityTab" component={ActivityStackNavigator} options={{ title: 'Actividad' }} />
    <Tab.Screen name="FleetTab" component={FleetStackNavigator} options={{ title: 'Flota' }} />
    <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Perfil' }} />
  </Tab.Navigator>
);

export default MainTabNavigator;
