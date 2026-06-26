import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useHomeAuxilioFlow } from '../../context/HomeAuxilioFlowContext';
import { COLORS } from '../../constants/theme';

const SOS_SCREENS = new Set(['SOSDetalle', 'SOSUbicacion', 'SOSConfirmar']);

const goHome = (navigation) => {
  const routeNames = navigation.getState()?.routeNames || [];
  if (routeNames.includes('HomeMain')) {
    navigation.replace('HomeMain');
    return;
  }
  navigation.getParent()?.goBack();
};

/** Redirige pantallas SOS legacy a los modales del flujo en Home. */
const LegacySosRedirectScreen = ({ navigation, route }) => {
  const {
    openSosWizard,
    openNoEmbarcacionModal,
    openNoSocioModal,
    openSinConexionModal,
  } = useHomeAuxilioFlow();
  const vessel = route.params?.vessel;
  const screenName = route.name;

  useEffect(() => {
    goHome(navigation);

    const timer = setTimeout(() => {
      if (SOS_SCREENS.has(screenName)) {
        if (vessel) openSosWizard(vessel);
        return;
      }
      if (screenName === 'NoEmbarcacion') {
        openNoEmbarcacionModal();
        return;
      }
      if (screenName === 'NoSocio') {
        openNoSocioModal();
        return;
      }
      if (screenName === 'SinConexion') {
        openSinConexionModal();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [
    navigation,
    openNoEmbarcacionModal,
    openNoSocioModal,
    openSinConexionModal,
    openSosWizard,
    screenName,
    vessel,
  ]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primaryAccent} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LegacySosRedirectScreen;
