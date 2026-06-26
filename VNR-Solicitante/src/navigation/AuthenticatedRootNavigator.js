import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import AuxilioStackNavigator from './AuxilioStackNavigator';
import RiverOnboardingStack from './RiverOnboardingStack';
import SOSWizardScreen, { SOS_WIZARD_OPTIONS } from '../screens/auxilio/SOSWizardScreen';
import NoSocioScreen from '../screens/auxilio/NoSocioScreen';
import NoEmbarcacionScreen from '../screens/auxilio/NoEmbarcacionScreen';
import SinConexionScreen from '../screens/auxilio/SinConexionScreen';
import { AuxilioTrackingScreen, ReportarProblemaScreen, AuxilioRechazadoScreen } from '../screens/auxilio';
import { RateAuxilioScreen } from '../screens/rating';
import { ChatScreen } from '../screens/chat';

const AuthenticatedStack = createNativeStackNavigator();

const MODAL_OPTIONS = {
  presentation: 'fullScreenModal',
  animation: 'slide_from_bottom',
  headerShown: false,
};

const AuthenticatedRootNavigator = () => (
  <AuthenticatedStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthenticatedStack.Screen name="Main" component={MainTabNavigator} />
    <AuthenticatedStack.Screen name="SOSWizard" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <AuthenticatedStack.Screen name="SOSDetalle" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <AuthenticatedStack.Screen name="SOSUbicacion" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <AuthenticatedStack.Screen name="SOSConfirmar" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <AuthenticatedStack.Screen name="NoEmbarcacion" component={NoEmbarcacionScreen} options={MODAL_OPTIONS} />
    <AuthenticatedStack.Screen name="NoSocio" component={NoSocioScreen} options={MODAL_OPTIONS} />
    <AuthenticatedStack.Screen name="SinConexion" component={SinConexionScreen} options={MODAL_OPTIONS} />
    <AuthenticatedStack.Screen
      name="AuxilioTracking"
      component={AuxilioTrackingScreen}
      options={{ gestureEnabled: false, animation: 'slide_from_right' }}
    />
    <AuthenticatedStack.Screen
      name="ReportarProblema"
      component={ReportarProblemaScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
    <AuthenticatedStack.Screen
      name="RateAuxilio"
      component={RateAuxilioScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
    <AuthenticatedStack.Screen
      name="AuxilioRechazado"
      component={AuxilioRechazadoScreen}
      options={{ gestureEnabled: false, animation: 'fade' }}
    />
    <AuthenticatedStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: true, title: 'Chat', presentation: 'modal' }}
    />
    <AuthenticatedStack.Screen
      name="Auxilio"
      component={AuxilioStackNavigator}
      options={{ presentation: 'modal' }}
    />
    <AuthenticatedStack.Screen name="OnboardingEmbarcacion" component={RiverOnboardingStack} />
  </AuthenticatedStack.Navigator>
);

export default AuthenticatedRootNavigator;
