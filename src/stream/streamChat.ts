import EventSource from "react-native-sse";
import { API_BASE_URL, APP_VERSION, APP_PLATFORM } from "../api/config";
import { getAccessToken } from "../auth/tokenStorage";
import type { ModelStreamEvent } from "../types/ai";

export interface StreamChatOptions {
  sessionId: string;
  message: string;
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
  const { sessionId, message, imageBase64, onEvent, onError, onComplete } = options;

  const token = await getAccessToken();
  const url = `${API_BASE_URL}/api/v1/medical_chat_stream`;

  const body = JSON.stringify({
    session_id: sessionId,
    message,
    ...(imageBase64 ? { image_base64: imageBase64 } : {}),
  });

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

  let closed = false;
  const close = () => {
    if (!closed) {
      closed = true;
      es.close();
    }
  };

  es.addEventListener("message", (event) => {
    if (!event.data || closed) return;
    try {
      const parsed: ModelStreamEvent = JSON.parse(event.data);
      onEvent(parsed);
      if (parsed.type === "complete") {
        close();
        onComplete?.();
      } else if (parsed.type === "error") {
        // C-6: route server errors through onError, not onComplete
        close();
        onError?.(new Error(parsed.content ?? "Stream error from server"));
      }
    } catch {
      // H-6: close stream on parse failure to prevent repeated errors
      close();
      onError?.(new Error("Failed to parse SSE event"));
    }
  });

  es.addEventListener("error", (event) => {
    if (closed) return;
    close();
    const msg = typeof event === "object" && event !== null && "message" in event
      ? String((event as { message: unknown }).message)
      : "SSE connection error";
    onError?.(new Error(msg));
  });

  return close;
}
