import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  SOSWizardModal,
  NoSocioModal,
  NoEmbarcacionModal,
  SinConexionModal,
} from '../components/riverservice';

const HomeAuxilioFlowContext = createContext(null);

export const HomeAuxilioFlowProvider = ({ children }) => {
  const navigationRef = useRef(null);
  const [sosVisible, setSosVisible] = useState(false);
  const [noSocioVisible, setNoSocioVisible] = useState(false);
  const [noEmbarcacionVisible, setNoEmbarcacionVisible] = useState(false);
  const [sinConexionVisible, setSinConexionVisible] = useState(false);
  const [sosVessel, setSosVessel] = useState(null);
  const [user, setUser] = useState(null);

  const registerNavigation = useCallback((navigation, authUser) => {
    navigationRef.current = navigation;
    setUser(authUser || null);
  }, []);

  const openSosWizard = useCallback((vessel) => {
    setSosVessel(vessel);
    setSosVisible(true);
  }, []);

  const closeSosWizard = useCallback(() => {
    setSosVisible(false);
    setSosVessel(null);
  }, []);

  const openNoSocioModal = useCallback(() => setNoSocioVisible(true), []);
  const closeNoSocioModal = useCallback(() => setNoSocioVisible(false), []);
  const openNoEmbarcacionModal = useCallback(() => setNoEmbarcacionVisible(true), []);
  const closeNoEmbarcacionModal = useCallback(() => setNoEmbarcacionVisible(false), []);
  const openSinConexionModal = useCallback(() => setSinConexionVisible(true), []);
  const closeSinConexionModal = useCallback(() => setSinConexionVisible(false), []);

  const handleSosSuccess = useCallback(
    (auxilio) => {
      closeSosWizard();
      navigationRef.current?.navigate('AuxilioTracking', {
        auxilioId: auxilio.id,
        auxilio,
      });
    },
    [closeSosWizard]
  );

  const goToAddVessel = useCallback(() => {
    closeNoEmbarcacionModal();
    navigationRef.current?.getParent()?.navigate('FleetTab', { screen: 'AddVessel' });
  }, [closeNoEmbarcacionModal]);

  const goToSubscription = useCallback(() => {
    closeNoSocioModal();
    navigationRef.current?.getParent()?.navigate('ProfileTab', { screen: 'Suscripcion' });
  }, [closeNoSocioModal]);

  const value = useMemo(
    () => ({
      registerNavigation,
      openSosWizard,
      closeSosWizard,
      openNoSocioModal,
      closeNoSocioModal,
      openNoEmbarcacionModal,
      closeNoEmbarcacionModal,
      openSinConexionModal,
      closeSinConexionModal,
    }),
    [
      registerNavigation,
      openSosWizard,
      closeSosWizard,
      openNoSocioModal,
      closeNoSocioModal,
      openNoEmbarcacionModal,
      closeNoEmbarcacionModal,
      openSinConexionModal,
      closeSinConexionModal,
    ]
  );

  return (
    <HomeAuxilioFlowContext.Provider value={value}>
      {children}
      <SOSWizardModal
        visible={sosVisible}
        onClose={closeSosWizard}
        vessel={sosVessel}
        user={user}
        onSuccess={handleSosSuccess}
      />
      <NoSocioModal
        visible={noSocioVisible}
        onClose={closeNoSocioModal}
        onJoin={goToSubscription}
      />
      <NoEmbarcacionModal
        visible={noEmbarcacionVisible}
        onClose={closeNoEmbarcacionModal}
        onAddVessel={goToAddVessel}
      />
      <SinConexionModal
        visible={sinConexionVisible}
        onClose={closeSinConexionModal}
      />
    </HomeAuxilioFlowContext.Provider>
  );
};

export const useHomeAuxilioFlow = () => {
  const ctx = useContext(HomeAuxilioFlowContext);
  if (!ctx) {
    throw new Error('useHomeAuxilioFlow debe usarse dentro de HomeAuxilioFlowProvider');
  }
  return ctx;
};

export default HomeAuxilioFlowContext;
