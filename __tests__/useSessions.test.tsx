import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useSessions, useCreateSession } from "../src/hooks/useSessions";
import { sessionsApi } from "../src/api/sessionsApi";
import { medicalApi } from "../src/api/medicalApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock("../src/api/sessionsApi");
jest.mock("../src/api/medicalApi");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
};

/**
 * IMP-170: Hook tests aligned to backend contract (IMP-161).
 * sessionsApi.list() returns bare SessionMeta[] (not { sessions, count }).
 */
describe("useSessions hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("useSessions fetches bare session array", async () => {
    const { queryClient, wrapper } = createWrapper();
    // IMP-170: bare array from backend
    const mockData = [
      { session_id: "1", status: "new", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", last_message_at: "2026-01-01T00:00:00Z" },
    ];
    (sessionsApi.list as jest.Mock).mockResolvedValue(mockData);

    const { result, unmount } = renderHook(() => useSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(sessionsApi.list).toHaveBeenCalled();

    unmount();
    queryClient.clear();
  });

  it("useCreateSession calls chat API with a session id", async () => {
    const { queryClient, wrapper } = createWrapper();
    const mockResponse = { response_type: "clarification", message: "ok", suggestions: [], intent: "greeting" };
    (medicalApi.chat as jest.Mock).mockResolvedValue(mockResponse);

    const { result, unmount } = renderHook(() => useCreateSession(), { wrapper });

    let createdSessionId = "";
    await act(async () => {
      const created = await result.current.mutateAsync({
        sessionId: "session-new-123",
        query: "Start consultation",
      });
      createdSessionId = created.sessionId;
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createdSessionId).toBe("session-new-123");
    expect(medicalApi.chat).toHaveBeenCalledWith({
      query: "Start consultation",
      session_id: "session-new-123",
    });

    unmount();
    queryClient.clear();
  });
});
