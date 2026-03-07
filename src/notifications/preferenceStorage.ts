import { Platform } from "react-native";
import type { ReminderPreferences } from "./types";
import { DEFAULT_PREFERENCES } from "./types";

const PREFS_KEY = "medbot_reminder_prefs";

let SecureStore: typeof import("expo-secure-store") | null = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

async function getRaw(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(PREFS_KEY);
    }
    return await SecureStore!.getItemAsync(PREFS_KEY);
  } catch {
    return null;
  }
}

async function setRaw(value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(PREFS_KEY, value);
      return;
    }
    await SecureStore!.setItemAsync(PREFS_KEY, value);
  } catch (e) {
    console.warn("preferenceStorage.setRaw failed:", e);
  }
}

export async function loadPreferences(): Promise<ReminderPreferences> {
  const raw = await getRaw();
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(
  prefs: ReminderPreferences,
): Promise<void> {
  await setRaw(JSON.stringify(prefs));
}
