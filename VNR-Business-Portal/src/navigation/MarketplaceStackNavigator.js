import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import ProductDetailScreen from '../screens/marketplace/ProductDetailScreen';
import ProductoDetalleScreen from '../screens/marketplace/ProductoDetalleScreen';
import CheckoutScreen from '../screens/marketplace/CheckoutScreen';
import CarritoScreen from '../screens/marketplace/CarritoScreen';
import MarketplaceAlquilerScreen from '../screens/marketplace/MarketplaceAlquilerScreen';
import CarritoAlquilerScreen from '../screens/marketplace/CarritoAlquilerScreen';

const Stack = createNativeStackNavigator();

const MarketplaceStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProductoDetalle"
        component={ProductoDetalleScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Carrito"
        component={CarritoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MarketplaceAlquiler"
        component={MarketplaceAlquilerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CarritoAlquiler"
        component={CarritoAlquilerScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MarketplaceStackNavigator;
