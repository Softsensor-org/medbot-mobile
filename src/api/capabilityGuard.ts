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

export const DEFAULT_CAPABILITIES: AppCapabilities = {
  modules: DEFAULT_MODULES,
};

let cachedCapabilities: AppCapabilities | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCapabilities(payload: unknown): AppCapabilities {
  const modulesFromPayload =
    isRecord(payload) && isRecord(payload.modules)
      ? (payload.modules as Partial<CapabilityModules>)
      : {};
  return {
    modules: {
      ...DEFAULT_MODULES,
      ...modulesFromPayload,
    },
  };
}

function parseCapabilitiesResponse(payload: unknown): AppCapabilities {
  if (isRecord(payload) && payload.success === true && isRecord(payload.data)) {
    return normalizeCapabilities(payload.data);
  }
  return normalizeCapabilities(payload);
}

// Invalidate cache when app returns to foreground
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    cachedCapabilities = null;
  }
});

/**
 * Fetch server capabilities. Cached after first successful call.
 * Falls back to safe defaults if the endpoint is unavailable.
 * Cache is invalidated when the app returns to foreground.
 */
export async function getCapabilities(): Promise<AppCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  try {
    const res = await client.get<unknown>("/api/v1/capabilities");
    cachedCapabilities = parseCapabilitiesResponse(res.data);
    return cachedCapabilities;
  } catch {
    // Safe defaults: keep core modules available, optional modules off.
    return DEFAULT_CAPABILITIES;
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

export const capabilityQueryOptions = {
  queryKey: capabilityQueryKey,
  queryFn: getCapabilities,
  staleTime: 300_000,
};
