import 'dotenv/config';

export default {
  expo: {
    name: "VNR",
    slug: "vnr-app",
    version: "1.0.0",
    scheme: "vnr",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.vnr.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "VNR necesita acceso a tu ubicación para mostrarte conductores cercanos y calcular rutas.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "VNR necesita acceso a tu ubicación en segundo plano para compartir tu posición durante el viaje."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.vnr.app",
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
      "expo-web-browser"
    ],
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: "982fbb0a-b5c2-42de-8a51-151afbb6599b"
      }
    },
    owner: "whapy"
  }
};
