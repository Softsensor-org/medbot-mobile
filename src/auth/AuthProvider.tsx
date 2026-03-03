import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  clearTokens,
} from "./tokenStorage";

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};
const AUTH0_DOMAIN: string = extra.auth0Domain ?? process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "";
const AUTH0_CLIENT_ID: string = extra.auth0ClientId ?? process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "";
const AUTH0_AUDIENCE: string = extra.auth0Audience ?? process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? "";

// Dev bypass: skip Auth0 when domain is a placeholder or missing
const DEV_AUTH_BYPASS =
  __DEV__ &&
  (!AUTH0_DOMAIN ||
    AUTH0_DOMAIN.includes("your-tenant") ||
    AUTH0_DOMAIN === "localhost");

const discovery: AuthSession.DiscoveryDocument = DEV_AUTH_BYPASS
  ? { authorizationEndpoint: "", tokenEndpoint: "", revocationEndpoint: "" }
  : {
      authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
      tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
      revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
    };

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const redirectUri = AuthSession.makeRedirectUri({ scheme: "medbot" });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "profile", "email", "offline_access"],
      extraParams: { audience: AUTH0_AUDIENCE },
      usePKCE: true,
    },
    discovery
  );

  // Restore persisted token on mount (or auto-login in dev mode)
  useEffect(() => {
    (async () => {
      if (DEV_AUTH_BYPASS) {
        setUser({ sub: "dev-user", email: "dev@medbot.local", name: "Dev User" });
        setToken("dev-bypass-token");
        setIsLoading(false);
        return;
      }
      const stored = await getAccessToken();
      if (stored) {
        setToken(stored);
        // Decode JWT payload for user info (no verification, display only)
        try {
          const payload = JSON.parse(atob(stored.split(".")[1]));
          setUser({ sub: payload.sub, email: payload.email, name: payload.name });
        } catch {
          // Token may be opaque; user info unavailable until next login
        }
      }
      setIsLoading(false);
    })();
  }, []);

  // Handle auth result
  useEffect(() => {
    if (result?.type === "success" && result.params.code) {
      (async () => {
        try {
          const tokenRes = await AuthSession.exchangeCodeAsync(
            {
              clientId: AUTH0_CLIENT_ID,
              code: result.params.code,
              redirectUri,
              extraParams: { code_verifier: request?.codeVerifier ?? "" },
            },
            discovery
          );
          const accessToken = tokenRes.accessToken;
          await setAccessToken(accessToken);
          if (tokenRes.refreshToken) {
            await setRefreshToken(tokenRes.refreshToken);
          }
          setToken(accessToken);

          // Parse user from id_token or access_token
          const idToken = tokenRes.idToken ?? accessToken;
          try {
            const payload = JSON.parse(atob(idToken.split(".")[1]));
            setUser({ sub: payload.sub, email: payload.email, name: payload.name });
          } catch {
            setUser({ sub: "unknown" });
          }
        } catch (err) {
          if (__DEV__) console.error("Token exchange failed:", err);
        }
      })();
    }
  }, [result, request?.codeVerifier]);

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setToken(null);
    // Optionally open Auth0 logout URL
    if (AUTH0_DOMAIN) {
      await WebBrowser.openAuthSessionAsync(
        `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${redirectUri}`,
        redirectUri
      );
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
