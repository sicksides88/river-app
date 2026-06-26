import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import RiderHomeStack from './RiderHomeStack';
import RiderServicioStack from './RiderServicioStack';
import RiderTurnosStack from './RiderTurnosStack';
import RiderProfileStack from './RiderProfileStack';

const Tab = createBottomTabNavigator();

const RiderTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.riderBlue,
      tabBarInactiveTintColor: COLORS.riderTabInactive,
      tabBarStyle: {
        backgroundColor: COLORS.riderTabBar,
        borderTopColor: COLORS.borderDark,
        borderTopWidth: 1,
        paddingTop: SIZES.xs,
        height: SIZES.tabBarHeight,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
    }}
  >
    <Tab.Screen
      name="RiderGuardiaTab"
      component={RiderHomeStack}
      options={{
        tabBarLabel: 'Guardia',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'shield' : 'shield-outline'} size={22} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="RiderServicioTab"
      component={RiderServicioStack}
      options={{
        tabBarLabel: 'Servicio',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'help-buoy' : 'help-buoy-outline'} size={22} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="RiderAgendaTab"
      component={RiderTurnosStack}
      options={{
        tabBarLabel: 'Agenda',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="RiderProfileTab"
      component={RiderProfileStack}
      options={{
        tabBarLabel: 'Perfil',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default RiderTabNavigator;
