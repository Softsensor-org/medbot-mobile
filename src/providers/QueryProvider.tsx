import React from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { capabilityQueryOptions } from "../api/capabilityGuard";

const isTestEnv = process.env.NODE_ENV === "test";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (__DEV__) console.error("[QueryCache] Error:", error.message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (__DEV__) console.error("[MutationCache] Error:", error.message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: isTestEnv ? Infinity : 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      gcTime: isTestEnv ? Infinity : 5 * 60 * 1000,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void queryClient.prefetchQuery(capabilityQueryOptions);
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
