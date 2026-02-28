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
import { queryClient } from "../providers/QueryProvider";

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};
const AUTH0_DOMAIN: string = extra.auth0Domain ?? process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "";
const AUTH0_CLIENT_ID: string = extra.auth0ClientId ?? process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "";
const AUTH0_AUDIENCE: string = extra.auth0Audience ?? process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? "";

// Dev bypass: skip Auth0 when domain is a placeholder or missing.
// CRITICAL: only allow in __DEV__ builds to prevent production bypass.
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

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

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
    let cancelled = false;

    (async () => {
      if (DEV_AUTH_BYPASS) {
        // H-2: persist to storage so the API client interceptor can read it
        await setAccessToken("dev-bypass-token");
        if (!cancelled) {
          setUser({ sub: "dev-user", email: "dev@medbot.local", name: "Dev User" });
          setToken("dev-bypass-token");
          setIsLoading(false);
        }
        return;
      }
      const stored = await getAccessToken();
      if (cancelled) return;
      if (stored) {
        setToken(stored);
        // Decode JWT payload for user info (no verification, display only)
        try {
          const parts = stored.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            setUser({ sub: payload.sub, email: payload.email, name: payload.name });
          }
        } catch {
          // Token may be opaque; user info unavailable until next login
        }
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle auth result — covers success, error, and cancel/dismiss
  useEffect(() => {
    if (!result) return;

    // Handle non-success outcomes so the app never stays stuck loading
    if (result.type === "error") {
      if (__DEV__) console.error("Auth error:", result.error);
      setIsLoading(false);
      return;
    }
    if (result.type === "cancel" || result.type === "dismiss") {
      setIsLoading(false);
      return;
    }
    if (result.type !== "success" || !result.params.code) return;

    // C-5: Validate PKCE code verifier before exchange
    const codeVerifier = request?.codeVerifier;
    if (!codeVerifier) {
      if (__DEV__) console.error("PKCE code verifier missing — cannot exchange code");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const tokenRes = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: result.params.code,
            redirectUri,
            extraParams: { code_verifier: codeVerifier },
          },
          discovery
        );
        if (cancelled) return;

        const accessToken = tokenRes.accessToken;
        await setAccessToken(accessToken);
        if (tokenRes.refreshToken) {
          await setRefreshToken(tokenRes.refreshToken);
        }
        if (cancelled) return;
        setToken(accessToken);

        // Parse user from id_token or access_token
        const idToken = tokenRes.idToken ?? accessToken;
        try {
          const parts = idToken.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            setUser({ sub: payload.sub, email: payload.email, name: payload.name });
          } else {
            setUser({ sub: "unknown" });
          }
        } catch {
          setUser({ sub: "unknown" });
        }
      } catch (err) {
        if (__DEV__) console.error("Token exchange failed:", err);
        // C-4: surface failure so the user is not stuck on a spinner
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [result, request?.codeVerifier]);

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await clearTokens();
    // H-10: clear cached queries to prevent medical data leaking between users
    queryClient.clear();
    setUser(null);
    setToken(null);
    // Open Auth0 logout URL to clear server-side session
    if (AUTH0_DOMAIN && !DEV_AUTH_BYPASS) {
      try {
        await WebBrowser.openAuthSessionAsync(
          `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${redirectUri}`,
          redirectUri
        );
      } catch {
        // Tokens already cleared locally — user is logged out on client
      }
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
