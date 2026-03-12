import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wellnessApi } from "../api/wellnessApi";
import { wellnessKeys } from "../queryKeys";
import type { IntakeModeValue, AppointmentType } from "../types/wellness";
import {
  executeWithOfflineQueue,
  retryOfflineQueueItem,
  subscribeOfflineQueue,
  type OfflineExecutionResult,
  type OfflineSyncStatus,
} from "../offline/offlineActionQueue";

export function useIntakeMode(sessionId: string) {
  return useQuery({
    queryKey: wellnessKeys.intakeMode(sessionId),
    queryFn: () => wellnessApi.getIntakeMode(sessionId),
    enabled: !!sessionId,
  });
}

export function useSetIntakeMode() {
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
      sessionId,
      mode,
    }: {
      sessionId: string;
      mode: IntakeModeValue;
    }): Promise<OfflineExecutionResult<unknown>> => {
      setSyncStatus("syncing");
      setSyncError(null);

      const result = await executeWithOfflineQueue({
        type: "wellness.setIntakeMode",
        payload: { sessionId, mode },
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
    onSuccess: (result, { sessionId }) => {
      if (result.mode === "synced") {
        void queryClient.invalidateQueries({ queryKey: wellnessKeys.intakeMode(sessionId) });
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

export function usePrevisitQuestions(appointmentType: string) {
  return useQuery({
    queryKey: wellnessKeys.previsitQuestions(appointmentType),
    queryFn: () => wellnessApi.getPrevisitQuestions(appointmentType),
    enabled: !!appointmentType,
  });
}

export function usePrevisitReadiness(sessionId: string) {
  return useQuery({
    queryKey: wellnessKeys.previsitReadiness(sessionId),
    queryFn: () => wellnessApi.getPrevisitReadiness(sessionId),
    enabled: !!sessionId,
  });
}

export function useSubmitPrevisitAnswer() {
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
      sessionId,
      questionId,
      answer,
    }: {
      sessionId: string;
      questionId: number;
      answer: unknown;
    }): Promise<OfflineExecutionResult<{ id: number }>> => {
      setSyncStatus("syncing");
      setSyncError(null);

      const result = await executeWithOfflineQueue<{ id: number }>({
        type: "wellness.submitPrevisitAnswer",
        payload: { sessionId, questionId, answer },
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
    onSuccess: (result, { sessionId }) => {
      if (result.mode === "synced") {
        void queryClient.invalidateQueries({ queryKey: wellnessKeys.previsitReadiness(sessionId) });
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

export function useAppointmentContext(sessionId: string) {
  return useQuery({
    queryKey: wellnessKeys.appointment(sessionId),
    queryFn: () => wellnessApi.getAppointmentContext(sessionId),
    enabled: !!sessionId,
  });
}

export function useSetAppointmentContext() {
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
      sessionId,
      appointment,
    }: {
      sessionId: string;
      appointment: {
        appointment_type: AppointmentType;
        appointment_datetime: string;
        clinic_location: string;
      };
    }): Promise<OfflineExecutionResult<unknown>> => {
      setSyncStatus("syncing");
      setSyncError(null);

      const result = await executeWithOfflineQueue({
        type: "wellness.setAppointmentContext",
        payload: { sessionId, appointment },
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
    onSuccess: (result, { sessionId }) => {
      if (result.mode === "synced") {
        void queryClient.invalidateQueries({ queryKey: wellnessKeys.appointment(sessionId) });
        void queryClient.invalidateQueries({ queryKey: wellnessKeys.previsitReadiness(sessionId) });
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
