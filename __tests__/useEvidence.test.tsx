import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUploadPhoto } from "../src/hooks/useEvidence";
import { medicalApi } from "../src/api/medicalApi";

jest.mock("../src/api/medicalApi", () => ({
  medicalApi: {
    uploadPhoto: jest.fn(),
  },
}));

describe("useUploadPhoto", () => {
  it("uploads through the medical chat image contract and refreshes session queries", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    (medicalApi.uploadPhoto as jest.Mock).mockResolvedValue({ response_type: "clarification" });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUploadPhoto(), { wrapper });

    result.current.mutate({ sessionId: "session-123", base64: "data:image/jpeg;base64,abc" });

    await waitFor(() => {
      expect(medicalApi.uploadPhoto).toHaveBeenCalledWith("session-123", "data:image/jpeg;base64,abc");
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["sessions", "detail", "session-123", "transcript"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["sessions", "detail", "session-123", "evidence-snapshot"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["sessions", "detail", "session-123"],
      });
    });
  });
});
