import EventSource from "react-native-sse";
import { API_BASE_URL, APP_VERSION, APP_PLATFORM } from "../api/config";
import { getAccessToken } from "../auth/tokenStorage";
import type { ModelStreamEvent } from "../types/ai";

export interface StreamChatOptions {
  sessionId: string;
  query: string;
  imageBase64?: string;
  onEvent: (event: ModelStreamEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * Stream chat responses via SSE using react-native-sse.
 * Returns a cleanup function to close the connection.
 */
export async function streamChat(options: StreamChatOptions): Promise<() => void> {
  const { sessionId, query, imageBase64, onEvent, onError, onComplete } = options;

  const token = await getAccessToken();
  const url = `${API_BASE_URL}/api/v1/medical/medical_chat_stream`;

  const body = JSON.stringify({
    session_id: sessionId,
    query,
    ...(imageBase64 ? { image_base64: imageBase64 } : {}),
  });

  const STREAM_TIMEOUT_MS = 60_000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clearStreamTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const resetTimeout = () => {
    clearStreamTimeout();
    timeoutId = setTimeout(() => {
      es.close();
      onError?.(new Error("Stream timed out — no data received for 60s"));
    }, STREAM_TIMEOUT_MS);
  };

  const es = new EventSource(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-App-Version": APP_VERSION,
      "X-App-Platform": APP_PLATFORM,
    },
    body,
  });

  resetTimeout();

  es.addEventListener("message", (event) => {
    if (!event.data) return;
    resetTimeout();
    try {
      const parsed: ModelStreamEvent = JSON.parse(event.data);
      onEvent(parsed);
      if (parsed.type === "complete" || parsed.type === "error") {
        clearStreamTimeout();
        es.close();
        onComplete?.();
      }
    } catch {
      onError?.(new Error(`Failed to parse SSE event: ${event.data}`));
    }
  });

  es.addEventListener("error", (event) => {
    clearStreamTimeout();
    onError?.(new Error(`SSE connection error: ${String(event)}`));
    es.close();
  });

  return () => {
    clearStreamTimeout();
    es.close();
  };
}
