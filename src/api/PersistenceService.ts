import { MMKV } from "react-native-mmkv";
import { Persister, PersistedClient } from "@tanstack/react-query-persist-client";

/**
 * High-performance persistence layer using MMKV.
 * Provides a synchronous storage engine for TanStack Query state.
 */
export const storage = new MMKV({
  id: "medbot-query-cache",
});

export const mmkvPersister: Persister = {
  persistClient: (client: PersistedClient) => {
    try {
      storage.set("react-query-cache", JSON.stringify(client));
    } catch (e) {
      console.error("[Persistence] Error persisting query cache", e);
    }
  },
  restoreClient: () => {
    try {
      const cache = storage.getString("react-query-cache");
      if (!cache) return undefined;
      return JSON.parse(cache) as PersistedClient;
    } catch (e) {
      console.warn("[Persistence] React query cache corruption detected, discarding", e);
      // IMP-166: Return undefined to force fresh fetch on corruption
      return undefined; 
    }
  },
  removeClient: () => {
    storage.delete("react-query-cache");
  },
};

/**
 * Generic persistence service for app state (e.g. notifications, feature flags)
 */
export const persistenceService = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const val = storage.getString(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch (error) {
      console.warn(`[Persistence] Error parsing key ${key}, recovering to null`, error);
      // IMP-166: Return null to trigger fallback defaults on corruption
      return null;
    }
  },
  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Persistence] Error setting key ${key}`, error);
    }
  },
  delete: async (key: string): Promise<void> => {
    storage.delete(key);
  }
};

/**
 * Utility to clear all persistent data (e.g. on logout).
 */
export function clearPersistentStorage() {
  storage.clearAll();
}
