import { APP_PLATFORM } from "../api/config";

const ACCESS_TOKEN_KEY = "medbot_access_token";
const REFRESH_TOKEN_KEY = "medbot_refresh_token";

async function getItem(key: string): Promise<string | null> {
  try {
    if (APP_PLATFORM === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    }
    // Lazy-load to avoid native-only imports on web/test
    const SecureStore = require("expo-secure-store");
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.warn(`tokenStorage.getItem(${key}) failed:`, e);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (APP_PLATFORM === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn(`tokenStorage.setItem(${key}) failed:`, e);
  }
}

async function deleteItem(key: string): Promise<void> {
  try {
    if (APP_PLATFORM === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    const SecureStore = require("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
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
