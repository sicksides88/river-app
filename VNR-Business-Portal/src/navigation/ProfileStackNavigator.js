import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import InformacionPersonalScreen from '../screens/profile/InformacionPersonalScreen';
import SeguridadScreen from '../screens/profile/SeguridadScreen';
import ProteccionDatosScreen from '../screens/profile/ProteccionDatosScreen';
import CambiarTelefonoScreen from '../screens/profile/CambiarTelefonoScreen';
import CambiarContrasenaScreen from '../screens/profile/CambiarContrasenaScreen';

// Chat
import { ConversationsScreen, ChatScreen } from '../screens/chat';

// Notifications
import { NotificationsScreen, NotificationSettingsScreen } from '../screens/notifications';

// Payment Methods
import { PaymentMethodsScreen, AddPaymentMethodScreen } from '../screens/wallet';

const Stack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Using custom headers in components
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />
      <Stack.Screen
        name="InformacionPersonal"
        component={InformacionPersonalScreen}
      />
      <Stack.Screen
        name="Seguridad"
        component={SeguridadScreen}
      />
      <Stack.Screen
        name="ProteccionDatos"
        component={ProteccionDatosScreen}
      />
      <Stack.Screen
        name="CambiarTelefono"
        component={CambiarTelefonoScreen}
      />
      <Stack.Screen
        name="CambiarContrasena"
        component={CambiarContrasenaScreen}
      />
      {/* Chat - Conversaciones */}
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
        }}
      />
      {/* Notifications */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      {/* Payment Methods */}
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
      />
      <Stack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethodScreen}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
