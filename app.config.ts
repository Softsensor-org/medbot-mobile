import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Medbot",
  slug: "medbot-mobile",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  scheme: "medbot",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.softsensor.medbot",
    infoPlist: {
      NSCameraUsageDescription: "Medbot uses the camera to capture symptom photos for your dermatology consultation.",
      NSPhotoLibraryUsageDescription: "Medbot accesses your photo library to upload symptom images.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.softsensor.medbot",
    permissions: ["CAMERA", "READ_EXTERNAL_STORAGE"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-camera",
      {
        cameraPermission: "Allow Medbot to access your camera for symptom photos.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Medbot to access your photos for symptom images.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#1976D2",
      },
    ],
    "@react-native-community/datetimepicker",
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
    auth0Domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "",
    auth0ClientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "",
    auth0Audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? "",
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "",
    },
  },
});
