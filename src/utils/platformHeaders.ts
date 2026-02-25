import { APP_VERSION, APP_PLATFORM } from "../api/config";

/** Standard headers for all API requests (already applied by client interceptor). */
export function getPlatformHeaders(): Record<string, string> {
  return {
    "X-App-Version": APP_VERSION,
    "X-App-Platform": APP_PLATFORM,
  };
}
