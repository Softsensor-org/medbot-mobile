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
    storage.set("react-query-cache", JSON.stringify(client));
  },
  restoreClient: () => {
    const cache = storage.getString("react-query-cache");
    if (!cache) return undefined;
    return JSON.parse(cache) as PersistedClient;
  },
  removeClient: () => {
    storage.delete("react-query-cache");
  },
};

/**
 * Utility to clear all persistent data (e.g. on logout).
 */
export function clearPersistentStorage() {
  storage.clearAll();
}
