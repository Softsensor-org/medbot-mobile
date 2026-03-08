import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessionsApi";
import { medicalApi } from "../api/medicalApi";
import { sessionKeys, SessionListParams } from "../queryKeys";

const DEFAULT_BOOTSTRAP_QUERY = "Start consultation";

export interface CreateSessionInput {
  sessionId?: string;
  query?: string;
}

export interface CreateSessionResult {
  sessionId: string;
}

export function generateSessionId(now = Date.now(), random = Math.random()): string {
  const timestamp = now.toString(36);
  const entropy = Math.floor(random * 1_000_000_000).toString(36);
  return `mob_${timestamp}_${entropy}`;
}

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

export function useEvidenceSnapshot(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.evidenceSnapshot(sessionId),
    queryFn: () => sessionsApi.getEvidenceSnapshot(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: CreateSessionInput): Promise<CreateSessionResult> => {
      const sessionId = input?.sessionId?.trim() || generateSessionId();
      const query = input?.query?.trim() || DEFAULT_BOOTSTRAP_QUERY;

      await medicalApi.chat({ query, session_id: sessionId });
      return { sessionId };
    },
    onSuccess: ({ sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}

export function useSessionPacket(sessionId: string) {
  return useQuery({
    queryKey: [...sessionKeys.detail(sessionId), "packet"],
    queryFn: () => sessionsApi.getPacket(sessionId),
    enabled: !!sessionId,
  });
}

export function useSharePacket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) => sessionsApi.sharePacket(sessionId),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}
