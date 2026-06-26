import 'dotenv/config';
import fs from 'fs';

// Solo referenciar google-services.json si el archivo existe (evita romper
// `expo start` antes de tener las credenciales de Firebase para Android).
const googleServicesFile = fs.existsSync('./google-services.json')
  ? './google-services.json'
  : undefined;

export default {
  expo: {
    name: "River Service Patrón",
    slug: "vnr-chofer",
    version: "1.0.0",
    scheme: "riverservice-rider",
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
      bundleIdentifier: "com.vnr.chofer",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "VNR Chofer necesita tu ubicación para recibir y realizar pedidos cercanos.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "VNR Chofer necesita tu ubicación en segundo plano para mantenerte disponible y seguir recibiendo pedidos mientras estás conectado.",
        // Permite mantener viva la app (socket + presencia) con la pantalla bloqueada
        // o la app minimizada mientras el chofer está conectado.
        UIBackgroundModes: ["location", "fetch", "remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.vnr.chofer",
      googleServicesFile,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
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
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "VNR Chofer usa tu ubicación en segundo plano para mantenerte disponible y seguir recibiendo pedidos mientras estás conectado.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
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
