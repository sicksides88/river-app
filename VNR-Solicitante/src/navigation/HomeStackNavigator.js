import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiverHomeScreen from '../screens/home/RiverHomeScreen';
import { ReportarProblemaScreen } from '../screens/auxilio';
import { RateRideScreen } from '../screens/rating';
import { ChatScreen } from '../screens/chat';

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={RiverHomeScreen} />
    <Stack.Screen name="ReportarProblema" component={ReportarProblemaScreen} />
    <Stack.Screen name="RateRide" component={RateRideScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Chat' }} />
  </Stack.Navigator>
);

export default HomeStackNavigator;
