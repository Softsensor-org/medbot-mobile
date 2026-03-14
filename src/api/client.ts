import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { API_BASE_URL, APP_VERSION, APP_PLATFORM } from "./config";
import { getAccessToken } from "../auth/tokenStorage";
import { refreshAccessToken } from "../auth/authRefresh";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

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

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
    return client(originalRequest);
  },
);

// Retry transient failures (network errors, 5xx, 429)
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

export { client as api };
export default client;
