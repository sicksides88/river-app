import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import ActivityScreen from '../screens/activity/ActivityScreen';
import ActivityDetailScreen from '../screens/activity/ActivityDetailScreen';
import AuxilioActivityDetailScreen from '../screens/activity/AuxilioActivityDetailScreen';

const Stack = createNativeStackNavigator();

const ActivityStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.primaryDark,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="ActivityMain"
        component={ActivityScreen}
        options={{
          title: 'Mi Actividad',
        }}
      />
      <Stack.Screen
        name="AuxilioActivityDetail"
        component={AuxilioActivityDetailScreen}
        options={{ title: 'Detalle del auxilio' }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{
          headerShown: true,
          title: 'Detalle',
        }}
      />
    </Stack.Navigator>
  );
};

export default ActivityStackNavigator;
