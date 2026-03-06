import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessionsApi";
import { medicalApi } from "../api/medicalApi";
import { sessionKeys, SessionListParams } from "../queryKeys";

export function useSessions(params: SessionListParams = { sort_by: "updated_at", sort_order: "desc" }) {
  return useQuery({
    queryKey: sessionKeys.list(params),
    queryFn: () => sessionsApi.list(params),
  });
}

export function useSessionDetail(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => sessionsApi.getDetail(sessionId),
    enabled: !!sessionId,
  });
}

export function useSessionTranscript(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.transcript(sessionId),
    queryFn: () => sessionsApi.getTranscript(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => medicalApi.chat({ message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}
