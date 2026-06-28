import React, { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

/** Un solo loader de Google Maps para toda la SPA — evita recargas al navegar entre páginas */
export const GoogleMapsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-river-crm',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const ctx = useContext(GoogleMapsContext);
  if (!ctx) {
    throw new Error('useGoogleMaps debe usarse dentro de GoogleMapsProvider');
  }
  return ctx;
};

export default GoogleMapsContext;
