import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SOSWizardFlow } from '../../components/riverservice/SOSWizardFlow';

const SOS_WIZARD_OPTIONS = {
  presentation: 'fullScreenModal',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
  headerShown: false,
};

const SOSWizardScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const vessel = route.params?.vessel;

  return (
    <SOSWizardFlow
      vessel={vessel}
      user={user}
      onClose={() => navigation.goBack()}
      onSuccess={(auxilio) => {
        navigation.replace('AuxilioTracking', {
          auxilioId: auxilio.id,
          auxilio,
        });
      }}
    />
  );
};

export { SOS_WIZARD_OPTIONS };
export default SOSWizardScreen;
