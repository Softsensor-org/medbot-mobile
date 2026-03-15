jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "../src/api/client";
import { usePatientProfile, useUser } from "../src/hooks/useUser";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useUser hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("reads the live /api/v1/me contract for the current user", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { id: "user-1", email: "patient@example.com", role: "patient" },
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/me");
      expect(result.current.user).toEqual({
        id: "user-1",
        email: "patient@example.com",
        role: "patient",
      });
    });
  });

  it("unwraps enveloped patient profile responses", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          preferred_name: "Maya",
          pronouns: "she/her",
          allergies: ["Fragrance"],
          conditions: [],
          program_context: {
            version: 1,
            membership: {
              status: "active",
              name: "Glow Club",
              cadence_label: "Monthly",
              renewal_at: "2026-04-15T00:00:00Z",
            },
            program: {
              status: "active",
              name: "Acne Reset Program",
              focus: "Acne Maintenance",
              summary: "Six-week physician-led acne reset.",
              target_date: "2026-05-01T00:00:00Z",
              source: "manual",
            },
            treatment_plan: {
              status: "active",
              name: "Azelaic + Peel Series",
              summary: "Continue nightly azelaic acid and monthly peel cadence.",
              next_review_at: "2026-03-28T00:00:00Z",
            },
          },
        },
      },
    });

    const { result } = renderHook(() => usePatientProfile(), { wrapper });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/wellness/patient/profile");
      expect(result.current.data?.preferred_name).toBe("Maya");
      expect(result.current.data?.program_context?.membership.name).toBe("Glow Club");
    });
  });
});
