import Constants from "expo-constants";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra ?? {};
const DEFAULT_API_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

export const API_BASE_URL: string =
  extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_URL;

export const APP_VERSION: string = Constants.expoConfig?.version ?? "0.0.0";

export const APP_PLATFORM: string = Platform.OS; // "ios" | "android"
