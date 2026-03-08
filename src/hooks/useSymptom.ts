import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export interface SubmitSymptomPayload {
  sessionId: string;
  payload: {
    severity: number;
    description: string;
    timestamp: string;
  };
}

export function useSubmitSymptom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, payload }: SubmitSymptomPayload) => {
      const response = await api.post(`/evidence/sessions/${sessionId}/symptoms`, payload);
      return response.data.data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["evidence", "session", sessionId] });
    },
  });
}
