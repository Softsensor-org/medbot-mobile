import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from '../api/medicalApi';
import { sessionKeys } from '../queryKeys';

/**
 * Stub hook for evidence sessions. Will be fleshed out when the evidence API is integrated.
 */
export function useEvidenceSessions() {
  return useQuery({
    queryKey: ['evidence_sessions'],
    queryFn: async () => [] as Array<{ session_id: string; status: string }>,
    enabled: false,
  });
}

/**
 * Stub mutation for uploading a photo to an evidence session.
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, base64 }: { sessionId: string; base64: string }) => {
      return medicalApi.uploadPhoto(sessionId, base64);
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['evidence_sessions'] });
      queryClient.invalidateQueries({ queryKey: sessionKeys.transcript(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.evidenceSnapshot(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}
