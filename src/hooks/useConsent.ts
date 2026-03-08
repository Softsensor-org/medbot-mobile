import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { consentApi, ConsentRecordRequest } from "../api/consentApi";

export const consentKeys = {
  all: ["consent"] as const,
  status: () => [...consentKeys.all, "status"] as const,
  types: () => [...consentKeys.all, "types"] as const,
  user: () => [...consentKeys.all, "user"] as const,
};

export function useConsentStatus() {
  return useQuery({
    queryKey: consentKeys.status(),
    queryFn: () => consentApi.getStatus(),
    staleTime: 60_000,
  });
}

export function useConsentTypes() {
  return useQuery({
    queryKey: consentKeys.types(),
    queryFn: () => consentApi.getTypes(),
    staleTime: 300_000,
  });
}

export function useUserConsents() {
  return useQuery({
    queryKey: consentKeys.user(),
    queryFn: () => consentApi.getUserConsents(),
  });
}

export function useRecordConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConsentRecordRequest) => consentApi.recordConsent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consentKeys.all });
    },
  });
}
