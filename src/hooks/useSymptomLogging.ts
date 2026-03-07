import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalApi } from "../api/medicalApi";
import { medicalKeys } from "../queryKeys";
import type { Symptom } from "../types/medical";
import {
  executeWithOfflineQueue,
  retryOfflineQueueItem,
  subscribeOfflineQueue,
  type OfflineExecutionResult,
  type OfflineSyncStatus,
} from "../offline/offlineActionQueue";

export function useSymptomTypes() {
  return useQuery({
    queryKey: medicalKeys.symptomTypes(),
    queryFn: () => medicalApi.getSymptomTypes(),
  });
}

export function useLogSymptom() {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = React.useState<OfflineSyncStatus>("idle");
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [queueItemId, setQueueItemId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!queueItemId) return;
    return subscribeOfflineQueue((event) => {
      if (event.itemId !== queueItemId) return;
      if (event.status === "syncing") {
        setSyncStatus("syncing");
        return;
      }
      if (event.status === "failed") {
        setSyncStatus("failed");
        setSyncError(event.error ?? "Offline sync failed");
        return;
      }
      if (event.status === "queued") {
        setSyncStatus("queued");
        return;
      }
      if (event.status === "synced") {
        setSyncStatus("synced");
        setSyncError(null);
        setQueueItemId(null);
        void queryClient.invalidateQueries({ queryKey: medicalKeys.symptoms() });
      }
    });
  }, [queueItemId, queryClient]);

  const mutation = useMutation({
    mutationFn: async (
      symptom: Omit<Symptom, "id" | "created_at">,
    ): Promise<OfflineExecutionResult<Symptom>> => {
      setSyncStatus("syncing");
      setSyncError(null);

      const result = await executeWithOfflineQueue<Symptom>({
        type: "medical.logSymptom",
        payload: symptom,
      });

      if (result.mode === "queued") {
        setSyncStatus("queued");
        setQueueItemId(result.queueItemId ?? null);
      } else {
        setSyncStatus("synced");
        setQueueItemId(null);
      }

      return result;
    },
    onSuccess: (result) => {
      if (result.mode === "synced") {
        void queryClient.invalidateQueries({ queryKey: medicalKeys.symptoms() });
      }
    },
  });

  const retrySync = React.useCallback(async () => {
    if (!queueItemId) return false;
    setSyncStatus("syncing");
    setSyncError(null);
    return retryOfflineQueueItem(queueItemId);
  }, [queueItemId]);

  return {
    ...mutation,
    syncStatus,
    syncError,
    retrySync,
  };
}

export function useSymptoms() {
  return useQuery({
    queryKey: medicalKeys.symptoms(),
    queryFn: () => medicalApi.getSymptoms(),
  });
}
