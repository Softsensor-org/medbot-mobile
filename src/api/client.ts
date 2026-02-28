import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import Constants from "expo-constants";
import { API_BASE_URL, APP_VERSION, APP_PLATFORM } from "./config";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "../auth/tokenStorage";
import { emitForceLogout } from "../auth/authEvents";

// Auth0 config for token refresh (reads same source as AuthProvider)
const extra = Constants.expoConfig?.extra ?? {};
const AUTH0_DOMAIN: string =
  extra.auth0Domain ?? process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "";
const AUTH0_CLIENT_ID: string =
  extra.auth0ClientId ?? process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "";

/** Shared Axios instance with Bearer auth, version headers, and retry policy. */
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token + platform headers to every request
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-App-Version"] = APP_VERSION;
  config.headers["X-App-Platform"] = APP_PLATFORM;
  return config;
});

// C-2 + H-4: 401 response interceptor — attempt token refresh, force logout on failure
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops
    if ((originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return client(originalRequest);
      });
    }

    (originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken || !AUTH0_DOMAIN) {
        throw new Error("No refresh token available");
      }

      // Use a raw axios call (not `client`) to avoid interceptor recursion
      const response = await axios.post(
        `https://${AUTH0_DOMAIN}/oauth/token`,
        {
          grant_type: "refresh_token",
          client_id: AUTH0_CLIENT_ID,
          refresh_token: refreshToken,
        }
      );

      const newAccessToken: string = response.data.access_token;
      await setAccessToken(newAccessToken);
      if (response.data.refresh_token) {
        await setRefreshToken(response.data.refresh_token);
      }

      isRefreshing = false;
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return client(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError, null);
      await clearTokens();
      emitForceLogout();
      return Promise.reject(error);
    }
  }
);

// H-1: Restrict retries to idempotent methods (GET/HEAD/OPTIONS) + 429 for any method
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error.response?.status === 429) {
      return true;
    }
    const method = error.config?.method?.toUpperCase();
    const isIdempotent = method === "GET" || method === "HEAD" || method === "OPTIONS";
    return isIdempotent && axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
});

export default client;
