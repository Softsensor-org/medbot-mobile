import { AppState } from "react-native";
import client from "./client";
import { capabilityKeys } from "../queryKeys";

export interface CapabilityModules {
  medical_chat: boolean;
  routines: boolean;
  symptoms: boolean;
  sessions: boolean;
  wellness_chat: boolean;
  ehr: boolean;
  calendar: boolean;
  usage: boolean;
  exposure: boolean;
  knowledge_base: boolean;
  [key: string]: boolean;
}

export interface AppCapabilities {
  modules: CapabilityModules;
}

const DEFAULT_MODULES: CapabilityModules = {
  medical_chat: true,
  routines: true,
  symptoms: true,
  sessions: true,
  wellness_chat: true,
  ehr: false,
  calendar: false,
  usage: false,
  exposure: false,
  knowledge_base: false,
};

let cachedCapabilities: AppCapabilities | null = null;

// Invalidate cache when app returns to foreground
if (typeof AppState.addEventListener === "function") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      cachedCapabilities = null;
    }
  });
}

/**
 * Fetch server capabilities. Cached after first successful call.
 * Falls back to safe defaults if the endpoint is unavailable.
 * Cache is invalidated when the app returns to foreground.
 */
export async function getCapabilities(): Promise<AppCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  try {
    const res = await client.get<AppCapabilities>(
      "/api/v1/capabilities"
    );
    cachedCapabilities = {
      modules: {
        ...DEFAULT_MODULES,
        ...(res.data?.modules || {}),
      },
    };
    return cachedCapabilities;
  } catch {
    cachedCapabilities = {
      modules: { ...DEFAULT_MODULES },
    };
    return cachedCapabilities;
  }
}

/** Check if a specific capability is available. */
export async function hasCapability(name: keyof CapabilityModules): Promise<boolean> {
  const caps = await getCapabilities();
  return caps.modules[name] === true;
}

/** Reset cached capabilities (useful on app foreground). */
export function resetCapabilities(): void {
  cachedCapabilities = null;
}

/** Query key for TanStack Query integration. */
export const capabilityQueryKey = capabilityKeys.all;
