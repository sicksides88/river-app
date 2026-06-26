import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

import DriverMenuScreen from '../screens/driver/menu/DriverMenuScreen';
import VehiclesScreen from '../screens/driver/vehicles/VehiclesScreen';
import AddVehicleScreen from '../screens/driver/vehicles/AddVehicleScreen';
import VehicleInfoScreen from '../screens/driver/vehicles/VehicleInfoScreen';
import DocumentsScreen from '../screens/driver/documents/DocumentsScreen';
import UploadVehicleDocumentScreen from '../screens/driver/documents/UploadVehicleDocumentScreen';
import DriverScheduleScreen from '../screens/driver/schedule/DriverScheduleScreen';
import MercadoPagoConnectScreen from '../screens/driver/wallet/MercadoPagoConnectScreen';

// Chat
import { ConversationsScreen, ChatScreen } from '../screens/chat';

// Payment Methods
import { PaymentMethodsScreen, AddPaymentMethodScreen } from '../screens/wallet';

// Marketplace (movido desde la app de usuario)
import MarketplaceStackNavigator from './MarketplaceStackNavigator';

const Stack = createNativeStackNavigator();

const DriverMenuStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DriverMenu" component={DriverMenuScreen} />
      <Stack.Screen name="Vehicles" component={VehiclesScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="UploadDocument" component={UploadVehicleDocumentScreen} />
      <Stack.Screen name="DriverSchedule" component={DriverScheduleScreen} />
      {/* Payment Methods */}
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
      {/* MercadoPago OAuth */}
      <Stack.Screen name="MercadoPagoConnect" component={MercadoPagoConnectScreen} />
      {/* Marketplace / Tienda */}
      <Stack.Screen name="Marketplace" component={MarketplaceStackNavigator} />
      {/* Chat - Conversaciones */}
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.white,
        }}
      />
    </Stack.Navigator>
  );
};

export default DriverMenuStack;
