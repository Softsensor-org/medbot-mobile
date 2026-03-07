import { Platform } from "react-native";

export interface EngagementSettings {
  hapticsEnabled: boolean;
}

const SETTINGS_KEY = "medbot.engagement.settings.v1";
const DEFAULT_SETTINGS: EngagementSettings = {
  hapticsEnabled: true,
};

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let memoryStore: Record<string, string> = {};
let cachedSettings: EngagementSettings | null = null;
const listeners = new Set<(settings: EngagementSettings) => void>();

function getStorage(): StorageLike {
  try {
    if (Platform.OS !== "web") {
      const { MMKV } = require("react-native-mmkv") as {
        MMKV: new (config?: { id?: string }) => {
          getString: (key: string) => string | undefined;
          set: (key: string, value: string) => void;
        };
      };
      const kv = new MMKV({ id: "medbot-engagement-settings" });
      return {
        getItem: (key) => kv.getString(key) ?? null,
        setItem: (key, value) => kv.set(key, value),
      };
    }
  } catch {
    // Fall through to browser/memory storage.
  }

  if (typeof localStorage !== "undefined") {
    return {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    };
  }

  return {
    getItem: (key) => memoryStore[key] ?? null,
    setItem: (key, value) => {
      memoryStore[key] = value;
    },
  };
}

function normalize(raw: Partial<EngagementSettings> | null | undefined): EngagementSettings {
  return {
    hapticsEnabled: raw?.hapticsEnabled ?? DEFAULT_SETTINGS.hapticsEnabled,
  };
}

export function getEngagementSettings(): EngagementSettings {
  if (cachedSettings) return cachedSettings;

  try {
    const raw = getStorage().getItem(SETTINGS_KEY);
    if (!raw) {
      cachedSettings = DEFAULT_SETTINGS;
      return cachedSettings;
    }
    cachedSettings = normalize(JSON.parse(raw) as Partial<EngagementSettings>);
    return cachedSettings;
  } catch {
    cachedSettings = DEFAULT_SETTINGS;
    return cachedSettings;
  }
}

export function updateEngagementSettings(
  patch: Partial<EngagementSettings> | ((prev: EngagementSettings) => Partial<EngagementSettings>),
): EngagementSettings {
  const current = getEngagementSettings();
  const nextPatch = typeof patch === "function" ? patch(current) : patch;
  const next = normalize({ ...current, ...nextPatch });
  cachedSettings = next;
  getStorage().setItem(SETTINGS_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
  return next;
}

export function subscribeEngagementSettings(
  listener: (settings: EngagementSettings) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetEngagementSettingsForTests() {
  memoryStore = {};
  cachedSettings = null;
  listeners.clear();
}
