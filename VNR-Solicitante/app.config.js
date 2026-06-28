import 'dotenv/config';
import fs from 'fs';

// Solo referenciar google-services.json si el archivo existe (evita romper
// `expo start` antes de tener las credenciales de Firebase para Android).
const googleServicesFile = fs.existsSync('./google-services.json')
  ? './google-services.json'
  : undefined;

export default {
  expo: {
    name: "River Service",
    slug: "river-service-navegante",
    version: "1.0.0",
    scheme: "riverservice",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-logo.png",
      resizeMode: "contain",
      backgroundColor: "#0B1220"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.vnr.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "River Service necesita tu ubicación para enviar auxilio náutico y mostrar tu posición en el mapa.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "River Service necesita tu ubicación para el seguimiento del auxilio."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0B1220"
      },
      edgeToEdgeEnabled: true,
      package: "com.vnr.app",
      googleServicesFile,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "FOREGROUND_SERVICE",
        "VIBRATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#667eea",
          android: {
            useNextNotificationsApi: true
          }
        }
      ],
      "expo-web-browser"
    ],
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      // projectId de EAS: lo crea `eas init`. Necesario para getExpoPushTokenAsync().
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    },
    owner: "whapy"
  }
};
