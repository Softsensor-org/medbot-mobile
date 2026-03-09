jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  api: {
    get: jest.fn(),
  }
}));

import api, { api as axiosApi } from "../src/api/client";
import { medicalApi } from "../src/api/medicalApi";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useFeatureFlags } from "../src/hooks/useFeatureFlags";
import { useGoalJourneys } from "../src/hooks/useUser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("FIX-014: Mobile Route Alignment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("useFeatureFlags calls /api/v1/capabilities", async () => {
    (axiosApi.get as jest.Mock).mockResolvedValue({ 
      data: { success: true, data: { modules: { usage: true } } } 
    });
    
    renderHook(() => useFeatureFlags(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(axiosApi.get).toHaveBeenCalledWith("/api/v1/capabilities");
    });
  });

  it("useGoalJourneys calls /api/v1/goals/journeys", async () => {
    (api.get as jest.Mock).mockResolvedValue({ 
      data: { success: true, data: [] } 
    });
    
    renderHook(() => useGoalJourneys(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/goals/journeys");
    });
  });

  it("medicalApi.getRoutineAssignments calls /api/v1/routines/assignments", async () => {
    // We mock the underlying get call of BaseApiService
    const mockGet = jest.spyOn(medicalApi as any, 'get').mockResolvedValue([]);
    
    await medicalApi.getRoutineAssignments();
    
    expect(mockGet).toHaveBeenCalledWith("/routines/assignments");
    // Since base is /api/v1, the actual axios call would be /api/v1/routines/assignments
  });
});
