import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/common';

// Stack Navigators
import HomeStackNavigator from './HomeStackNavigator';
import ActivityStackNavigator from './ActivityStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import MarketplaceStackNavigator from './MarketplaceStackNavigator';

// Screens
import ServicesTabScreen from '../screens/services/ServicesTabScreen';

const Tab = createBottomTabNavigator();

// MainTabNavigator basado en diseño Figma
// 5 tabs: Home, Servicios, Historial, Marketplace, Más
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesTabScreen}
        options={{ title: 'Servicios' }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityStackNavigator}
        options={{ title: 'Historial' }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStackNavigator}
        options={{ title: 'Tienda' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: 'Más' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
