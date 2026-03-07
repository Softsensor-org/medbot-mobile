import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { consentApi } from "../api/consentApi";
import type { ConsentRecordRequest } from "../types/consent";

export const consentKeys = {
  all: ["consent"] as const,
  types: () => [...consentKeys.all, "types"] as const,
  status: () => [...consentKeys.all, "status"] as const,
  records: () => [...consentKeys.all, "records"] as const,
};

export function useConsentTypes() {
  return useQuery({
    queryKey: consentKeys.types(),
    queryFn: () => consentApi.getTypes(),
  });
}

export function useConsentStatus() {
  return useQuery({
    queryKey: consentKeys.status(),
    queryFn: () => consentApi.getStatus(),
  });
}

export function useConsentRecords() {
  return useQuery({
    queryKey: consentKeys.records(),
    queryFn: () => consentApi.getUserRecords(),
  });
}

export function useRecordConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ConsentRecordRequest) =>
      consentApi.recordConsent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consentKeys.status() });
      queryClient.invalidateQueries({ queryKey: consentKeys.records() });
    },
  });
}
