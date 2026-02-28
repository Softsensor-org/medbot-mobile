type LogoutListener = () => void;

const listeners: Set<LogoutListener> = new Set();

/** Register a callback invoked on forced logout (e.g., 401 after refresh failure). */
export function onForceLogout(listener: LogoutListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Trigger forced logout — called by the API 401 interceptor. */
export function emitForceLogout(): void {
  listeners.forEach((fn) => fn());
}
