import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    mutationFn: async (_payload: { sessionId: string; base64: string }) => {
      // Placeholder — will call evidence API when ready
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence_sessions'] });
    },
  });
}
