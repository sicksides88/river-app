import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  OnboardingEmbarcacionScreen,
  OnboardingLinkTypeScreen,
  OnboardingAseguradoraScreen,
  OnboardingIndependienteScreen,
  VerifyEmailScreen,
} from '../screens/onboarding/riverservice';

const Stack = createNativeStackNavigator();

const RiverOnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="OnboardingEmbarcacion">
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="OnboardingEmbarcacion" component={OnboardingEmbarcacionScreen} />
    <Stack.Screen name="OnboardingLinkType" component={OnboardingLinkTypeScreen} />
    <Stack.Screen name="OnboardingAseguradora" component={OnboardingAseguradoraScreen} />
    <Stack.Screen name="OnboardingIndependiente" component={OnboardingIndependienteScreen} />
  </Stack.Navigator>
);

export default RiverOnboardingStack;
