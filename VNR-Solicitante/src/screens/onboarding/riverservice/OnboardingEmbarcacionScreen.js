import React from 'react';
import AddVesselScreen from '../../fleet/AddVesselScreen';
import { navigateAfterEmbarcacion } from '../../../utils/onboardingNavigation';

const OnboardingEmbarcacionScreen = (props) => (
  <AddVesselScreen
    {...props}
    route={{
      ...props.route,
      params: {
        ...props.route?.params,
        isOnboarding: true,
        onSaved: () => navigateAfterEmbarcacion(props.navigation, { skipped: false }),
        onSkip: () => navigateAfterEmbarcacion(props.navigation, { skipped: true }),
      },
    }}
  />
);

export default OnboardingEmbarcacionScreen;
