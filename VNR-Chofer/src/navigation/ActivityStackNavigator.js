import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import ActivityScreen from '../screens/activity/ActivityScreen';
import ActivityDetailScreen from '../screens/activity/ActivityDetailScreen';

const Stack = createNativeStackNavigator();

const ActivityStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
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
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{
          title: 'Detalle',
        }}
      />
    </Stack.Navigator>
  );
};

export default ActivityStackNavigator;
