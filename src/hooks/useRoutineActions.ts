import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { routineKeys } from "../queryKeys";
import type { RoutineAssignmentActionRequest } from "../types/medical";
import {
  executeWithOfflineQueue,
  retryOfflineQueueItem,
  subscribeOfflineQueue,
  type OfflineExecutionResult,
  type OfflineSyncStatus,
} from "../offline/offlineActionQueue";

export function useCompleteAssignment() {
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
      }
    });
  }, [queueItemId]);

  const mutation = useMutation({
    mutationFn: async ({
      assignmentId,
      payload,
    }: {
      assignmentId: number;
      payload: RoutineAssignmentActionRequest;
    }): Promise<OfflineExecutionResult<unknown>> => {
      setSyncStatus("syncing");
      setSyncError(null);
      const result = await executeWithOfflineQueue({
        type: "medical.routineAssignmentAction",
        payload: { assignmentId, payload },
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
        void queryClient.invalidateQueries({ queryKey: routineKeys.all });
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

export function useDeferAssignment() {
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
      }
    });
  }, [queueItemId]);

  const mutation = useMutation({
    mutationFn: async ({
      assignmentId,
      payload,
    }: {
      assignmentId: number;
      payload: RoutineAssignmentActionRequest;
    }): Promise<OfflineExecutionResult<unknown>> => {
      setSyncStatus("syncing");
      setSyncError(null);
      const result = await executeWithOfflineQueue({
        type: "medical.routineAssignmentAction",
        payload: { assignmentId, payload },
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
        void queryClient.invalidateQueries({ queryKey: routineKeys.all });
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
