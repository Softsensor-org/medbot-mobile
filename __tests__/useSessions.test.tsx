import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useSessions, useCreateSession } from "../src/hooks/useSessions";
import { sessionsApi } from "../src/api/sessionsApi";
import { medicalApi } from "../src/api/medicalApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock the APIs
jest.mock("../src/api/sessionsApi");
jest.mock("../src/api/medicalApi");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useSessions hooks", () => {
  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it("useSessions fetches session list", async () => {
    const mockData = { sessions: [{ session_id: "1" }], count: 1 };
    (sessionsApi.list as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(sessionsApi.list).toHaveBeenCalled();
  });

  it("useCreateSession calls chat API and invalidates list", async () => {
    const mockResponse = { success: true, session_id: "new-123" };
    (medicalApi.chat as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("start");
    });

    expect(medicalApi.chat).toHaveBeenCalledWith({ message: "start" });
  });
});
