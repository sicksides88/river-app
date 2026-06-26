import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AuxilioTrackingScreen,
  AuxilioRechazadoScreen,
  ReportarProblemaScreen,
} from '../screens/auxilio';
import SOSWizardScreen, { SOS_WIZARD_OPTIONS } from '../screens/auxilio/SOSWizardScreen';
import NoSocioScreen from '../screens/auxilio/NoSocioScreen';
import NoEmbarcacionScreen from '../screens/auxilio/NoEmbarcacionScreen';
import SinConexionScreen from '../screens/auxilio/SinConexionScreen';
import { RateAuxilioScreen } from '../screens/rating';

const Stack = createNativeStackNavigator();

const MODAL_OPTIONS = { presentation: 'fullScreenModal', animation: 'slide_from_bottom' };

const AuxilioStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SOSWizard" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <Stack.Screen name="SOSDetalle" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <Stack.Screen name="SOSUbicacion" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <Stack.Screen name="SOSConfirmar" component={SOSWizardScreen} options={SOS_WIZARD_OPTIONS} />
    <Stack.Screen name="AuxilioTracking" component={AuxilioTrackingScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="ReportarProblema" component={ReportarProblemaScreen} />
    <Stack.Screen name="NoSocio" component={NoSocioScreen} options={MODAL_OPTIONS} />
    <Stack.Screen name="NoEmbarcacion" component={NoEmbarcacionScreen} options={MODAL_OPTIONS} />
    <Stack.Screen name="SinConexion" component={SinConexionScreen} options={MODAL_OPTIONS} />
    <Stack.Screen name="AuxilioRechazado" component={AuxilioRechazadoScreen} />
    <Stack.Screen name="RateAuxilio" component={RateAuxilioScreen} options={{ presentation: 'modal', gestureEnabled: false }} />
  </Stack.Navigator>
);

export default AuxilioStackNavigator;
