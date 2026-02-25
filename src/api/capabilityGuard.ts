import client from "./client";
import { capabilityKeys } from "../queryKeys";

export interface ServerCapabilities {
  streaming: boolean;
  photo_analysis: boolean;
  nudges: boolean;
  evidence_snapshot: boolean;
  provider_packet: boolean;
  [key: string]: boolean;
}

let cachedCapabilities: ServerCapabilities | null = null;

/**
 * Fetch server capabilities. Cached after first successful call.
 * Falls back to safe defaults if the endpoint is unavailable.
 */
export async function getCapabilities(): Promise<ServerCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  try {
    const res = await client.get<{ success: boolean; data: ServerCapabilities }>(
      "/api/v1/capabilities"
    );
    cachedCapabilities = res.data.data;
    return cachedCapabilities;
  } catch {
    // Safe defaults: assume minimal capabilities
    return {
      streaming: false,
      photo_analysis: false,
      nudges: false,
      evidence_snapshot: false,
      provider_packet: false,
    };
  }
}

/** Check if a specific capability is available. */
export async function hasCapability(name: keyof ServerCapabilities): Promise<boolean> {
  const caps = await getCapabilities();
  return caps[name] === true;
}

/** Reset cached capabilities (useful on app foreground). */
export function resetCapabilities(): void {
  cachedCapabilities = null;
}

/** Query key for TanStack Query integration. */
export const capabilityQueryKey = capabilityKeys.all;
