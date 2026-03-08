import React from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache, onlineManager } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import NetInfo from "@react-native-community/netinfo";
import { capabilityQueryOptions } from "../api/capabilityGuard";
import { processOfflineQueue } from "../offline/offlineActionQueue";
import { medicalKeys, routineKeys, wellnessKeys } from "../queryKeys";
import { mmkvPersister } from "../api/PersistenceService";
import { FEATURE_FLAGS } from "../config/constants";

const isTestEnv = process.env.NODE_ENV === "test";

// Configure online manager for React Native
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export const queryClient = new QueryClient({
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
      gcTime: isTestEnv ? Infinity : 24 * 60 * 60 * 1000, // 24 hours for offline cache
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: (FEATURE_FLAGS.ENABLE_OFFLINE_MODE && !isTestEnv) ? "offlineFirst" : "online",
    },
    mutations: {
      networkMode: (FEATURE_FLAGS.ENABLE_OFFLINE_MODE && !isTestEnv) ? "offlineFirst" : "online",
      retry: 3, // More retries for mutations
      gcTime: isTestEnv ? Infinity : 24 * 60 * 60 * 1000,
    },
  },
});

// Apply persistence
if (FEATURE_FLAGS.ENABLE_OFFLINE_MODE && !isTestEnv) {
  persistQueryClient({
    queryClient,
    persister: mmkvPersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void queryClient.prefetchQuery(capabilityQueryOptions);
  }, []);

  React.useEffect(() => {
    if (isTestEnv) return;

    let active = true;

    const runSync = async () => {
      const result = await processOfflineQueue();
      if (!active || result.synced === 0) return;

      if (result.syncedActionTypes.some((type) => type === "medical.logSymptom")) {
        void queryClient.invalidateQueries({ queryKey: medicalKeys.symptoms() });
      }
      if (
        result.syncedActionTypes.some((type) =>
          type === "wellness.setIntakeMode" ||
          type === "wellness.submitPrevisitAnswer" ||
          type === "wellness.setAppointmentContext",
        )
      ) {
        void queryClient.invalidateQueries({ queryKey: wellnessKeys.all });
      }
      if (result.syncedActionTypes.some((type) => type === "medical.routineAssignmentAction")) {
        void queryClient.invalidateQueries({ queryKey: routineKeys.all });
      }
    };

    void runSync();
    const intervalId = setInterval(() => {
      void runSync();
    }, 15_000);

    const onOnline = () => {
      void runSync();
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
        if (state.isConnected) {
            onOnline();
        }
    });

    return () => {
      active = false;
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
