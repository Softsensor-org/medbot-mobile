import axios from "axios";
import { Platform } from "react-native";
import { medicalApi } from "../api/medicalApi";
import { wellnessApi } from "../api/wellnessApi";
import type {
  RoutineAssignmentActionRequest,
  Symptom,
} from "../types/medical";
import type { AppointmentType, IntakeModeValue } from "../types/wellness";

const STORAGE_KEY = "medbot.offline.queue.v1";

type QueueStatus = "queued" | "syncing" | "failed";
export type OfflineSyncStatus = "idle" | "queued" | "syncing" | "synced" | "failed";

export type OfflineAction =
  | {
      type: "medical.logSymptom";
      payload: Omit<Symptom, "id" | "created_at">;
    }
  | {
      type: "wellness.setIntakeMode";
      payload: { sessionId: string; mode: IntakeModeValue };
    }
  | {
      type: "wellness.submitPrevisitAnswer";
      payload: { sessionId: string; questionId: number; answer: unknown };
    }
  | {
      type: "wellness.setAppointmentContext";
      payload: {
        sessionId: string;
        appointment: {
          appointment_type: AppointmentType;
          appointment_datetime: string;
          clinic_location: string;
        };
      };
    }
  | {
      type: "medical.routineAssignmentAction";
      payload: { assignmentId: number; payload: RoutineAssignmentActionRequest };
    };

export interface OfflineQueueItem {
  id: string;
  action: OfflineAction;
  status: QueueStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export interface OfflineExecutionResult<T> {
  mode: "synced" | "queued";
  data?: T;
  queueItemId?: string;
}

export interface OfflineQueueEvent {
  itemId: string;
  actionType: OfflineAction["type"];
  status: QueueStatus | "synced";
  error?: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let memoryStore: Record<string, string> = {};
let processingPromise: Promise<ProcessQueueResult> | null = null;
const listeners = new Set<(event: OfflineQueueEvent) => void>();

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getStorage(): StorageLike {
  try {
    // Prefer durable native storage on mobile.
    if (Platform.OS !== "web") {
      const { MMKV } = require("react-native-mmkv") as { MMKV: new (config?: { id?: string }) => { getString: (key: string) => string | undefined; set: (key: string, value: string) => void } };
      const kv = new MMKV({ id: "medbot-offline-queue" });
      return {
        getItem: (key) => kv.getString(key) ?? null,
        setItem: (key, value) => kv.set(key, value),
      };
    }
  } catch {
    // Fall through to web/local fallback.
  }

  if (typeof localStorage !== "undefined") {
    return {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    };
  }

  return {
    getItem: (key) => memoryStore[key] ?? null,
    setItem: (key, value) => {
      memoryStore[key] = value;
    },
  };
}

function emit(event: OfflineQueueEvent) {
  listeners.forEach((listener) => listener(event));
}

function parseQueue(raw: string | null): OfflineQueueItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readQueue(): OfflineQueueItem[] {
  return parseQueue(getStorage().getItem(STORAGE_KEY));
}

function writeQueue(items: OfflineQueueItem[]) {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(items));
}

function isRetryableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (!error.response) return true;
    const status = error.response.status;
    return status === 408 || status === 425 || status === 429 || status >= 500;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("failed to fetch") ||
      msg.includes("timeout") ||
      msg.includes("err_network")
    );
  }

  return false;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Offline sync failed";
}

function withIdempotencyIfNeeded(action: OfflineAction): OfflineAction {
  if (action.type !== "medical.routineAssignmentAction") return action;
  if (action.payload.payload.idempotency_key) return action;

  return {
    ...action,
    payload: {
      ...action.payload,
      payload: {
        ...action.payload.payload,
        idempotency_key: `mob_offline_${randomId()}`,
      },
    },
  };
}

async function executeAction(action: OfflineAction): Promise<unknown> {
  switch (action.type) {
    case "medical.logSymptom":
      return medicalApi.logSymptom(action.payload);
    case "wellness.setIntakeMode":
      return wellnessApi.setIntakeMode(action.payload.sessionId, action.payload.mode);
    case "wellness.submitPrevisitAnswer":
      return wellnessApi.submitPrevisitAnswer(
        action.payload.sessionId,
        action.payload.questionId,
        action.payload.answer,
      );
    case "wellness.setAppointmentContext":
      return wellnessApi.setAppointmentContext(action.payload.sessionId, action.payload.appointment);
    case "medical.routineAssignmentAction":
      return medicalApi.postRoutineAssignmentAction(action.payload.assignmentId, action.payload.payload);
    default:
      return Promise.reject(new Error("Unsupported offline action"));
  }
}

function enqueueAction(action: OfflineAction): OfflineQueueItem {
  const item: OfflineQueueItem = {
    id: `q_${randomId()}`,
    action,
    status: "queued",
    attempts: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  emit({ itemId: item.id, actionType: item.action.type, status: "queued" });
  return item;
}

export async function executeWithOfflineQueue<T>(actionInput: OfflineAction): Promise<OfflineExecutionResult<T>> {
  const action = withIdempotencyIfNeeded(actionInput);

  // Best-effort attempt to drain older queue entries first.
  void processOfflineQueue();

  try {
    const data = (await executeAction(action)) as T;
    return { mode: "synced", data };
  } catch (error) {
    if (!isRetryableError(error)) {
      throw error;
    }
    const queuedItem = enqueueAction(action);
    return {
      mode: "queued",
      queueItemId: queuedItem.id,
    };
  }
}

export interface ProcessQueueResult {
  synced: number;
  failed: number;
  remaining: number;
  syncedActionTypes: OfflineAction["type"][];
}

export async function processOfflineQueue(): Promise<ProcessQueueResult> {
  if (processingPromise) return processingPromise;

  processingPromise = (async () => {
    let queue = readQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0, remaining: 0, syncedActionTypes: [] };
    }

    // Recover interrupted syncing state.
    queue = queue.map((item) => (item.status === "syncing" ? { ...item, status: "queued" as const } : item));
    writeQueue(queue);

    let synced = 0;
    let failed = 0;
    const syncedTypes = new Set<OfflineAction["type"]>();

    for (const current of [...queue]) {
      const index = queue.findIndex((item) => item.id === current.id);
      if (index < 0) continue;

      queue[index] = {
        ...queue[index],
        status: "syncing",
        attempts: queue[index].attempts + 1,
        updatedAt: nowIso(),
        lastError: undefined,
      };
      writeQueue(queue);
      emit({ itemId: queue[index].id, actionType: queue[index].action.type, status: "syncing" });

      try {
        await executeAction(queue[index].action);
        const syncedItem = queue[index];
        queue.splice(index, 1);
        writeQueue(queue);
        synced += 1;
        syncedTypes.add(syncedItem.action.type);
        emit({ itemId: syncedItem.id, actionType: syncedItem.action.type, status: "synced" });
      } catch (error) {
        queue[index] = {
          ...queue[index],
          status: "failed",
          updatedAt: nowIso(),
          lastError: normalizeError(error),
        };
        writeQueue(queue);
        failed += 1;
        emit({
          itemId: queue[index].id,
          actionType: queue[index].action.type,
          status: "failed",
          error: queue[index].lastError,
        });
      }
    }

    return {
      synced,
      failed,
      remaining: queue.length,
      syncedActionTypes: [...syncedTypes],
    };
  })().finally(() => {
    processingPromise = null;
  });

  return processingPromise;
}

export async function retryOfflineQueueItem(itemId: string): Promise<boolean> {
  const queue = readQueue();
  const index = queue.findIndex((item) => item.id === itemId);
  if (index < 0) return false;

  queue[index] = {
    ...queue[index],
    status: "queued",
    updatedAt: nowIso(),
    lastError: undefined,
  };
  writeQueue(queue);
  emit({ itemId: queue[index].id, actionType: queue[index].action.type, status: "queued" });
  await processOfflineQueue();
  return true;
}

export function getOfflineQueueSnapshot(): OfflineQueueItem[] {
  return readQueue();
}

export function getOfflineQueueStats(): { queued: number; failed: number } {
  const queue = readQueue();
  return {
    queued: queue.filter((item) => item.status === "queued" || item.status === "syncing").length,
    failed: queue.filter((item) => item.status === "failed").length,
  };
}

export function subscribeOfflineQueue(listener: (event: OfflineQueueEvent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetOfflineQueueForTests() {
  listeners.clear();
  memoryStore = {};
  writeQueue([]);
}
