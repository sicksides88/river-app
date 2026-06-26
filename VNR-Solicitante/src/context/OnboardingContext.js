import React, { createContext, useContext } from 'react';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children, onComplete }) => (
  <OnboardingContext.Provider value={{ completeOnboarding: onComplete }}>
    {children}
  </OnboardingContext.Provider>
);

export const useOnboarding = () => useContext(OnboardingContext);

export default OnboardingContext;
