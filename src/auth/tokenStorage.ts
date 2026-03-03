import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "medbot_access_token";
const REFRESH_TOKEN_KEY = "medbot_refresh_token";

// expo-secure-store is native-only — importing it on web throws.
// Lazy-load it only on native platforms.
let SecureStore: typeof import("expo-secure-store") | null = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore!.getItemAsync(key);
  } catch (e) {
    console.warn(`tokenStorage.getItem(${key}) failed:`, e);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore!.setItemAsync(key, value);
  } catch (e) {
    console.warn(`tokenStorage.setItem(${key}) failed:`, e);
  }
}

async function deleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore!.deleteItemAsync(key);
  } catch (e) {
    console.warn(`tokenStorage.deleteItem(${key}) failed:`, e);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await setItem(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
}
