import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  clearTokens,
} from "./tokenStorage";
import {
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
  AUTH0_AUDIENCE,
  DEV_AUTH_BYPASS,
  authDiscovery,
  authRedirectUri,
} from "./authConfig";
import { registerAuthFailureHandler } from "./authRefresh";

WebBrowser.maybeCompleteAuthSession();

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri: authRedirectUri,
      scopes: ["openid", "profile", "email", "offline_access"],
      extraParams: { audience: AUTH0_AUDIENCE },
      usePKCE: true,
    },
    authDiscovery
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

  useEffect(() => {
    return registerAuthFailureHandler(() => {
      setUser(null);
      setToken(null);
    });
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
              redirectUri: authRedirectUri,
              extraParams: { code_verifier: request?.codeVerifier ?? "" },
            },
            authDiscovery
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
        `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${authRedirectUri}`,
        authRedirectUri
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
