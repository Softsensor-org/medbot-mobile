import React from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { capabilityQueryOptions } from "../api/capabilityGuard";
import { processOfflineQueue } from "../offline/offlineActionQueue";
import { medicalKeys, routineKeys, wellnessKeys } from "../queryKeys";

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

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("online", onOnline);
    }

    return () => {
      active = false;
      clearInterval(intervalId);
      if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
        window.removeEventListener("online", onOnline);
      }
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
