import * as AuthSession from "expo-auth-session";
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, DEV_AUTH_BYPASS, authDiscovery } from "./authConfig";
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./tokenStorage";

let refreshPromise: Promise<string | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export function registerAuthFailureHandler(handler: () => void) {
  authFailureHandler = handler;
  return () => {
    if (authFailureHandler === handler) {
      authFailureHandler = null;
    }
  };
}

async function notifyAuthFailure() {
  await clearTokens();
  authFailureHandler?.();
}

export async function refreshAccessToken(): Promise<string | null> {
  if (DEV_AUTH_BYPASS) {
    return getAccessToken();
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken || !authDiscovery.tokenEndpoint) {
      await notifyAuthFailure();
      return null;
    }

    try {
      const tokenResponse = await AuthSession.refreshAsync(
        {
          clientId: AUTH0_CLIENT_ID,
          refreshToken,
          scopes: ["openid", "profile", "email", "offline_access"],
          extraParams: AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : undefined,
        },
        authDiscovery,
      );

      await setAccessToken(tokenResponse.accessToken);
      if (tokenResponse.refreshToken) {
        await setRefreshToken(tokenResponse.refreshToken);
      }
      return tokenResponse.accessToken;
    } catch {
      await notifyAuthFailure();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
