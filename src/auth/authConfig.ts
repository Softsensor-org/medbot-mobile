import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const AUTH0_DOMAIN: string = extra.auth0Domain ?? process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "";
export const AUTH0_CLIENT_ID: string = extra.auth0ClientId ?? process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "";
export const AUTH0_AUDIENCE: string = extra.auth0Audience ?? process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? "";

export const DEV_AUTH_BYPASS =
  __DEV__ &&
  (!AUTH0_DOMAIN || AUTH0_DOMAIN.includes("your-tenant") || AUTH0_DOMAIN === "localhost");

export const authDiscovery: AuthSession.DiscoveryDocument = DEV_AUTH_BYPASS
  ? { authorizationEndpoint: "", tokenEndpoint: "", revocationEndpoint: "" }
  : {
      authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
      tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
      revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
    };

export const authRedirectUri = AuthSession.makeRedirectUri({ scheme: "medbot" });
