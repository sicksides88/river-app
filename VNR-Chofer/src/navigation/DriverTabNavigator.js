import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

// Stack Navigators
import DriverHomeStack from './DriverHomeStack';
import DriverEarningsStack from './DriverEarningsStack';
import DriverNotificationsScreen from '../screens/driver/notifications/DriverNotificationsScreen';
import DriverMenuStack from './DriverMenuStack';

const Tab = createBottomTabNavigator();

const DriverTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        // Sin height fijo ni paddingBottom manual: React Navigation aplica el
        // safe-area inferior automáticamente (home indicator en iOS, gestos/
        // botones en Android). Forzar height rompía ese comportamiento.
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="DriverHomeTab"
        component={DriverHomeStack}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="DriverEarningsTab"
        component={DriverEarningsStack}
        options={{
          tabBarLabel: 'Ganancias',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "cash" : "cash-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DriverNotificationsTab"
        component={DriverNotificationsScreen}
        options={{
          tabBarLabel: 'Notificaciones',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DriverMenuTab"
        component={DriverMenuStack}
        options={{
          tabBarLabel: 'Menú',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name="menu"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.borderLight,
    borderTopWidth: 1,
    paddingTop: SIZES.xs,
    // height/paddingBottom los maneja React Navigation con el safe-area.
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    padding: 4,
  },
  iconContainerActive: {
    // El icono de inicio tiene un borde cuando está activo
  },
});

export default DriverTabNavigator;
